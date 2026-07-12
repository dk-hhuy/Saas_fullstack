"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { MAX_COMPANION_TAGS, MARKETPLACE_TAGS, type MarketplaceTag } from "@/constants/marketplace";
import { isAdminUser } from "@/lib/admin";
import { createAuthenticatedSupabaseClient, createSupabaseClient } from "@/lib/supabase";

function normalizeTags(tags: string[]): string[] {
  const allowed = new Set<string>(MARKETPLACE_TAGS);
  return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
    .filter((tag) => allowed.has(tag))
    .slice(0, MAX_COMPANION_TAGS);
}

async function assertCompanionOwner(companionId: string, userId: string) {
  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select("id, author, is_public, marketplace_status")
    .eq("id", companionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.author !== userId) {
    throw new Error("Companion not found or access denied");
  }

  return data;
}

export async function submitForMarketplace(companionId: string, tags: string[] = []) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const companion = await assertCompanionOwner(companionId, userId);
  if (!companion.is_public) {
    throw new Error("Make your companion public before submitting to the marketplace");
  }

  if (companion.marketplace_status === "pending") {
    throw new Error("This companion is already pending review");
  }

  if (companion.marketplace_status === "approved") {
    throw new Error("This companion is already on the marketplace");
  }

  const normalizedTags = normalizeTags(tags);
  const supabase = createAuthenticatedSupabaseClient();

  const { error } = await supabase
    .from("companions")
    .update({
      marketplace_status: "pending",
      tags: normalizedTags,
      featured: false,
    })
    .eq("id", companionId)
    .eq("author", userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/companions/${companionId}/edit`);
  revalidatePath("/companions");
  revalidatePath("/");
}

export async function reviewMarketplaceCompanion(
  companionId: string,
  decision: "approve" | "reject",
  featured = false
) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    throw new Error("Admin access required");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("id, is_public, marketplace_status")
    .eq("id", companionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!companion) throw new Error("Companion not found");

  const { error } = await supabase
    .from("companions")
    .update({
      marketplace_status: decision === "approve" ? "approved" : "rejected",
      featured: decision === "approve" ? featured : false,
    })
    .eq("id", companionId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/marketplace");
  revalidatePath("/companions");
  revalidatePath("/");
}

export async function listPendingMarketplaceCompanions() {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    throw new Error("Admin access required");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select(
      "id, name, subject, topic, author, tags, created_at, rating_count, average_rating"
    )
    .eq("marketplace_status", "pending")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reportCompanion(companionId: string, reason: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    throw new Error("Please provide at least 10 characters describing the issue");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const { data: companion, error: fetchError } = await supabase
    .from("companions")
    .select("id, author, is_public")
    .eq("id", companionId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!companion?.is_public) throw new Error("Companion not found");
  if (companion.author === userId) {
    throw new Error("You cannot report your own companion");
  }

  const { error } = await supabase.from("companion_reports").insert({
    reporter_id: userId,
    companion_id: companionId,
    reason: trimmed.slice(0, 1000),
  });

  if (error) throw new Error(error.message);
}

export async function getFeaturedCompanions(limit = 6) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("is_public", true)
    .eq("marketplace_status", "approved")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Companion[];
}

export interface CreatorProfile {
  userId: string;
  displayName: string;
  companions: Companion[];
  totalClones: number;
  companionCount: number;
}

export async function getCreatorProfile(creatorId: string): Promise<CreatorProfile> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("author", creatorId)
    .eq("is_public", true)
    .eq("marketplace_status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const companions = (data ?? []) as Companion[];
  const totalClones = companions.reduce((sum, c) => sum + (c.clone_count ?? 0), 0);

  let displayName = "Creator";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(creatorId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    if (name) displayName = name;
  } catch {
    displayName = `Creator ${creatorId.slice(0, 8)}`;
  }

  return {
    userId: creatorId,
    displayName,
    companions,
    totalClones,
    companionCount: companions.length,
  };
}

export async function listPopularMarketplaceTags() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select("tags")
    .eq("is_public", true)
    .eq("marketplace_status", "approved");

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of (row.tags ?? []) as string[]) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}
