"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createSupabaseClient,
  createAuthenticatedSupabaseClient,
} from "@/lib/supabase";
import { canAccessCompanion } from "@/lib/utils";
import { canCreateMoreCompanions } from "@/lib/plan-access";
import { normalizeSessionLocale } from "@/constants/locales";
import { LIBRARY_PAGE_SIZE, SESSIONS_PAGE_SIZE } from "@/constants/pagination";
import { applyLearningStatsOnFinalize } from "@/lib/learning-stats";
import {
  finalizeSessionRecord,
  insertSessionDraft,
  updateSessionCheckpoint,
  type SessionDraftPayload,
  type SessionFinalizePayload,
} from "@/lib/session-persistence";
import { appendSessionMessages, loadSessionTranscript } from "@/lib/session-messages";
import { isSearchableTerm, sanitizeLibrarySearchTerm } from "@/lib/library-search";
import { withSlowQueryWarning } from "@/lib/query-timing";

const REVALIDATE_PATHS = ["/", "/companions", "/my-journey"] as const;

function revalidateCompanionPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

function pageRange(page: number, limit: number) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * limit;
  return { from, to: from + limit - 1 };
}

function applyCompanionSearchFilters<T extends {
  ilike: (col: string, val: string) => T;
  or: (filters: string) => T;
}>(query: T, subject?: string | string[], topic?: string | string[]) {
  const subjectTerm =
    typeof subject === "string" ? sanitizeLibrarySearchTerm(subject) : "";
  const topicTerm = isSearchableTerm(topic) ? sanitizeLibrarySearchTerm(topic) : "";

  if (subjectTerm && topicTerm) {
    return query
      .ilike("subject", `%${subjectTerm}%`)
      .or(`topic.ilike.%${topicTerm}%,name.ilike.%${topicTerm}%`);
  }
  if (subjectTerm) {
    return query.ilike("subject", `%${subjectTerm}%`);
  }
  if (topicTerm) {
    return query.or(`topic.ilike.%${topicTerm}%,name.ilike.%${topicTerm}%`);
  }
  return query;
}

function applyBookmarkSearchFilters<T extends {
  filter: (col: string, op: string, val: string) => T;
  or: (filters: string) => T;
}>(query: T, subject?: string | string[], topic?: string | string[]) {
  const subjectTerm =
    typeof subject === "string" ? sanitizeLibrarySearchTerm(subject) : "";
  const topicTerm = isSearchableTerm(topic) ? sanitizeLibrarySearchTerm(topic) : "";

  if (subjectTerm && topicTerm) {
    return query
      .filter("companions.subject", "ilike", `%${subjectTerm}%`)
      .or(
        `companions.topic.ilike.%${topicTerm}%,companions.name.ilike.%${topicTerm}%`
      );
  }
  if (subjectTerm) {
    return query.filter("companions.subject", "ilike", `%${subjectTerm}%`);
  }
  if (topicTerm) {
    return query.or(
      `companions.topic.ilike.%${topicTerm}%,companions.name.ilike.%${topicTerm}%`
    );
  }
  return query;
}

function applyPublicLibraryScope<T extends { eq: (col: string, val: unknown) => T }>(
  query: T,
  filter: LibraryFilterOption
) {
  if (filter === "featured") {
    return query
      .eq("is_public", true)
      .eq("marketplace_status", "approved")
      .eq("featured", true);
  }

  if (filter === "marketplace") {
    return query.eq("is_public", true).eq("marketplace_status", "approved");
  }

  return query.eq("is_public", true);
}

function applyTagFilter<T extends { contains: (col: string, val: string[]) => T }>(
  query: T,
  tag?: string
) {
  const normalized = tag?.trim().toLowerCase();
  if (!normalized) return query;
  return query.contains("tags", [normalized]);
}

function applyLibrarySort<T extends { order: (col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(
  query: T,
  sort: LibrarySortOption
) {
  if (sort === "most_cloned") {
    return query
      .order("clone_count", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (sort === "popular") {
    return query
      .order("rating_count", { ascending: false })
      .order("average_rating", { ascending: false, nullsFirst: false });
  }

  if (sort === "top_rated") {
    return query
      .order("rating_count", { ascending: false })
      .order("average_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  return query.order("created_at", { ascending: false });
}

export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();
  if (!author) throw new Error("You must be signed in to create a companion");

  const supabase = createAuthenticatedSupabaseClient();
  const { is_public = false, system_prompt, session_locale = "en", ...rest } = formData;

  const { data, error } = await supabase
    .from("companions")
    .insert({
      ...rest,
      author,
      is_public,
      system_prompt: system_prompt?.trim() || null,
      session_locale: normalizeSessionLocale(session_locale),
    })
    .select();

  if (error || !data) throw new Error(error?.message || "Failed to create a companion");

  revalidateCompanionPaths();
  return data[0];
};

export const updateCompanion = async (id: string, formData: UpdateCompanion) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to update a companion");

  const supabase = createAuthenticatedSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("companions")
    .select("author")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new Error("Companion not found");
  if (existing.author !== userId) {
    throw new Error("You can only edit companions you created");
  }

  const { is_public = false, system_prompt, session_locale = "en", ...rest } = formData;

  const { data, error } = await supabase
    .from("companions")
    .update({
      ...rest,
      is_public,
      system_prompt: system_prompt?.trim() || null,
      session_locale: normalizeSessionLocale(session_locale),
    })
    .eq("id", id)
    .eq("author", userId)
    .select();

  if (error || !data) throw new Error(error?.message || "Failed to update companion");

  revalidateCompanionPaths();
  revalidatePath(`/companions/${id}`);
  revalidatePath(`/companions/${id}/edit`);

  return data[0];
};

export const deleteCompanion = async (id: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to delete a companion");

  const supabase = createAuthenticatedSupabaseClient();

  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("author")
    .eq("id", id)
    .single();

  if (fetchError || !companion) throw new Error("Companion not found");
  if (companion.author !== userId) {
    throw new Error("You can only delete companions you created");
  }

  const { error } = await supabase
    .from("companions")
    .delete()
    .eq("id", id)
    .eq("author", userId);

  if (error) throw new Error(error.message || "Failed to delete companion");

  revalidateCompanionPaths();
  return { success: true };
};

async function fetchSavedCompanionsPage(
  userId: string,
  options: {
    page: number;
    limit: number;
    subject?: string | string[];
    topic?: string | string[];
    countOnly?: boolean;
  }
) {
  const supabase = createAuthenticatedSupabaseClient();
  const { from, to } = pageRange(options.page, options.limit);

  if (options.countOnly) {
    let query = supabase
      .from("bookmarks")
      .select("id, companions:companion_id!inner(id)", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId);

    query = applyBookmarkSearchFilters(query, options.subject, options.topic);

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return { companions: [] as Companion[], total: count ?? 0 };
  }

  let query = supabase
    .from("bookmarks")
    .select("companions:companion_id!inner(*)", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  query = applyBookmarkSearchFilters(query, options.subject, options.topic);

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  const companions = (data ?? [])
    .map((row) => row.companions as unknown as Companion | null)
    .filter((c): c is Companion => c !== null);

  return { companions, total: count ?? 0 };
}

export const countAllCompanions = async ({
  subject,
  topic,
  filter = "all",
  tag,
}: Omit<GetAllCompanions, "limit" | "page" | "sort">) => {
  const { userId } = await auth();

  if (filter === "mine") {
    if (!userId) return 0;
    const supabase = createAuthenticatedSupabaseClient();
    let query = supabase
      .from("companions")
      .select("id", { count: "exact", head: true })
      .eq("author", userId);

    query = applyCompanionSearchFilters(query, subject, topic);

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  if (filter === "saved") {
    if (!userId) return 0;
    const { total } = await fetchSavedCompanionsPage(userId, {
      page: 1,
      limit: 1,
      subject,
      topic,
      countOnly: true,
    });
    return total;
  }

  const supabase = createSupabaseClient();
  let query = supabase.from("companions").select("id", { count: "exact", head: true });

  query = applyPublicLibraryScope(query, filter);
  query = applyCompanionSearchFilters(query, subject, topic);
  query = applyTagFilter(query, tag);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const getCompanionsLibrary = async ({
  limit = LIBRARY_PAGE_SIZE,
  page = 1,
  subject,
  topic,
  filter = "all",
  sort = "newest",
  tag,
}: GetAllCompanions): Promise<CompanionsLibraryResult> => {
  return withSlowQueryWarning("getCompanionsLibrary", async () => {
  const safePage = Math.max(1, page);
  const [companions, total] = await Promise.all([
    getAllCompanions({ limit, page: safePage, subject, topic, filter, sort, tag }),
    countAllCompanions({ subject, topic, filter, tag }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    companions,
    total,
    page: safePage,
    limit,
    totalPages,
  };
  });
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
  filter = "all",
  sort = "newest",
  tag,
}: GetAllCompanions) => {
  const { userId } = await auth();
  const safeSort: LibrarySortOption =
    sort === "popular" || sort === "top_rated" || sort === "most_cloned"
      ? sort
      : "newest";
  const { from, to } = pageRange(page, limit);

  if (filter === "mine") {
    if (!userId) return [];
    const supabase = createAuthenticatedSupabaseClient();
    let query = supabase.from("companions").select().eq("author", userId);

    query = applyCompanionSearchFilters(query, subject, topic);
    query = applyLibrarySort(query, "newest");

    const { data, error } = await query.range(from, to);
    if (error) throw new Error(error.message);
    return (data ?? []) as Companion[];
  }

  if (filter === "saved") {
    if (!userId) return [];
    const { companions } = await fetchSavedCompanionsPage(userId, {
      page,
      limit,
      subject,
      topic,
    });
    return companions;
  }

  const supabase = createSupabaseClient();
  let query = supabase.from("companions").select();

  query = applyPublicLibraryScope(query, filter);
  query = applyCompanionSearchFilters(query, subject, topic);
  query = applyTagFilter(query, tag);
  query = applyLibrarySort(query, safeSort);

  const { data, error } = await query.range(from, to);
  if (error) throw new Error(error?.message || "Failed to fetch companions");

  return (data ?? []) as Companion[];
};

export const getCompanion = async (id: string) => {
  const { userId } = await auth();
  const supabase = userId
    ? createAuthenticatedSupabaseClient()
    : createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error?.message || "Failed to fetch companion");
  if (!data) throw new Error("Companion not found");

  return data;
};

export const startSessionDraft = async (payload: SessionDraftPayload) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to start a session");

  const supabase = createAuthenticatedSupabaseClient();
  const data = await insertSessionDraft(supabase, userId, payload);

  revalidateCompanionPaths();
  return data;
};

export const checkpointSession = async (
  sessionId: string,
  transcript: SavedMessage[]
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to save progress");

  const supabase = createAuthenticatedSupabaseClient();
  return updateSessionCheckpoint(supabase, userId, sessionId, transcript);
};

export const finalizeSession = async (
  sessionId: string,
  payload: SessionFinalizePayload
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to save a session");

  const supabase = createAuthenticatedSupabaseClient();
  const data = await finalizeSessionRecord(supabase, userId, sessionId, payload);

  if (!data) {
    throw new Error("Session not found or already finalized");
  }

  await applyLearningStatsOnFinalize(supabase, userId, {
    endedAt: payload.endedAt,
    durationSeconds: payload.durationSeconds,
    subject: payload.companionSubject ?? "other",
  });

  revalidateCompanionPaths();
  revalidatePath(`/sessions/${sessionId}`);

  return data;
};

export const saveSession = async (payload: SaveSessionPayload) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to save a session");

  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("session_history")
    .insert({
      companion_id: payload.companionId,
      user_id: userId,
      transcript: payload.transcript,
      duration_seconds: payload.durationSeconds,
      started_at: payload.startedAt,
      ended_at: payload.endedAt,
      companion_name: payload.companionName ?? null,
      companion_topic: payload.companionTopic ?? null,
      companion_subject: payload.companionSubject ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to save session");

  if (payload.transcript.length > 0) {
    await appendSessionMessages(supabase, data.id, payload.transcript);
  }

  await applyLearningStatsOnFinalize(supabase, userId, {
    endedAt: payload.endedAt,
    durationSeconds: payload.durationSeconds,
    subject: payload.companionSubject ?? "other",
  });

  revalidateCompanionPaths();
  revalidatePath(`/sessions/${data.id}`);

  return data;
};

/** @deprecated Use saveSession instead */
export const addToSessionHistory = async (companionId: string) => {
  return saveSession({
    companionId,
    transcript: [],
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 0,
  });
};

export const getSession = async (sessionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to view this session");

  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("session_history")
    .select(`*, companions:companion_id (*)`)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to fetch session");
  if (!data) throw new Error("Session not found");

  const transcript = await loadSessionTranscript(
    supabase,
    sessionId,
    (data.transcript ?? []) as SavedMessage[]
  );

  return { ...data, transcript } as SessionWithCompanion;
};

function mapSessionRows(
  rows: Array<{
    id: string;
    created_at: string;
    companion_id: string;
    duration_seconds?: number | null;
    companion_name?: string | null;
    companion_topic?: string | null;
    companion_subject?: string | null;
    companions: Companion | Companion[] | null;
  }>
) {
  return rows.map(
    ({
      id,
      companion_id,
      companions,
      created_at,
      duration_seconds,
      companion_name,
      companion_topic,
      companion_subject,
    }) => {
      const companion = Array.isArray(companions) ? companions[0] : companions;

      if (companion) {
        return {
          ...companion,
          sessionDate: created_at,
          sessionId: id,
          actualDuration: duration_seconds,
        };
      }

      const durationMinutes =
        duration_seconds != null
          ? Math.max(1, Math.round(duration_seconds / 60))
          : 15;

      return {
        id: companion_id,
        name: companion_name ?? "Unavailable companion",
        topic:
          companion_topic ?? "This companion is private or was removed",
        subject: companion_subject ?? "science",
        duration: durationMinutes,
        voice: "",
        style: "",
        author: "",
        is_public: false,
        sessionDate: created_at,
        sessionId: id,
        actualDuration: duration_seconds,
        companionUnavailable: true,
      };
    }
  );
}

export const getUserSession = async (
  userId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const page = Math.max(1, options.page ?? 1);
  const limit = options.limit ?? SESSIONS_PAGE_SIZE;
  const { from, to } = pageRange(page, limit);

  const supabase = createAuthenticatedSupabaseClient();

  const { data, error, count } = await supabase
    .from("session_history")
    .select(
      `id, created_at, duration_seconds, companion_id, companion_name, companion_topic, companion_subject, companions:companion_id (*)`,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error?.message || "Failed to fetch recent sessions");

  const total = count ?? 0;

  return {
    sessions: mapSessionRows(data ?? []),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

/** @deprecated Use getUserSession with pagination */
export const getUserSessionList = async (userId: string, limit = 10) => {
  const result = await getUserSession(userId, { page: 1, limit });
  return result.sessions;
};

export const getUserCompanions = async (userId: string) => {
  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("author", userId);

  if (error) throw new Error(error?.message);

  return data ?? [];
};

export const newCompanionPermissions = async () => {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createAuthenticatedSupabaseClient();

  const { count, error } = await supabase
    .from("companions")
    .select("id", { count: "exact", head: true })
    .eq("author", userId);

  if (error) throw new Error(error.message);

  return canCreateMoreCompanions(count ?? 0);
};

export const cloneCompanion = async (sourceId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to clone a companion");

  const canCreate = await newCompanionPermissions();
  if (!canCreate) {
    throw new Error("You've reached your companion limit. Upgrade to clone more.");
  }

  const source = await getCompanion(sourceId);
  if (!canAccessCompanion(source, userId)) {
    throw new Error("Companion not found or not accessible");
  }

  if (source.author === userId) {
    throw new Error("You already own this companion");
  }

  const cloneName = source.name.endsWith(" (Copy)")
    ? source.name
    : `${source.name} (Copy)`;

  return createCompanion({
    name: cloneName,
    subject: source.subject,
    topic: source.topic,
    voice: source.voice,
    style: source.style,
    duration: Number(source.duration),
    is_public: false,
    system_prompt: source.system_prompt ?? null,
    session_locale: source.session_locale,
  }).then(async (clone) => {
    if (source.is_public) {
      const supabase = createAuthenticatedSupabaseClient();
      await supabase.rpc("increment_companion_clone_count", {
        p_companion_id: sourceId,
      });
    }
    revalidateCompanionPaths();
    return clone;
  });
};
