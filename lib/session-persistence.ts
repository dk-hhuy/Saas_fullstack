import type { SupabaseClient } from "@supabase/supabase-js";
import {
  appendSessionMessages,
  validateTranscriptPayload,
} from "@/lib/session-messages";

export interface SessionDraftPayload {
  companionId: string;
  companionName?: string;
  companionTopic?: string;
  companionSubject?: string;
}

export interface SessionFinalizePayload {
  transcript: SavedMessage[];
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  companionName?: string;
  companionTopic?: string;
  companionSubject?: string;
}

export async function insertSessionDraft(
  supabase: SupabaseClient,
  userId: string,
  payload: SessionDraftPayload
) {
  const startedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("session_history")
    .insert({
      companion_id: payload.companionId,
      user_id: userId,
      transcript: [],
      started_at: startedAt,
      ended_at: null,
      duration_seconds: 0,
      companion_name: payload.companionName ?? null,
      companion_topic: payload.companionTopic ?? null,
      companion_subject: payload.companionSubject ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to start session draft");
  return data;
}

export async function updateSessionCheckpoint(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  transcript: SavedMessage[]
) {
  const { data: session, error: fetchError } = await supabase
    .from("session_history")
    .select("started_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!session) return null;

  const sanitized = validateTranscriptPayload(transcript);
  await appendSessionMessages(supabase, sessionId, sanitized);

  const startedAt = session.started_at ?? new Date().toISOString();
  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
  );

  const { error } = await supabase
    .from("session_history")
    .update({
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("ended_at", null);

  if (error) throw new Error(error.message || "Failed to checkpoint session");
  return { durationSeconds };
}

export async function finalizeSessionRecord(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  payload: SessionFinalizePayload
) {
  const sanitized = validateTranscriptPayload(payload.transcript);
  await appendSessionMessages(supabase, sessionId, sanitized);

  const { data, error } = await supabase
    .from("session_history")
    .update({
      transcript: sanitized,
      started_at: payload.startedAt,
      ended_at: payload.endedAt,
      duration_seconds: payload.durationSeconds,
      companion_name: payload.companionName ?? null,
      companion_topic: payload.companionTopic ?? null,
      companion_subject: payload.companionSubject ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("ended_at", null)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to finalize session");
  return data;
}
