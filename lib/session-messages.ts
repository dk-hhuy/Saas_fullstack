import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_CHECKPOINT_PAYLOAD_BYTES,
  MAX_MESSAGE_CONTENT_CHARS,
  MAX_SESSION_MESSAGES,
} from "@/constants/session";

const VALID_ROLES = new Set<SavedMessage["role"]>(["user", "assistant", "system"]);

function normalizeRole(role: string): SavedMessage["role"] {
  if (VALID_ROLES.has(role as SavedMessage["role"])) {
    return role as SavedMessage["role"];
  }
  return "assistant";
}

/** Sanitize and cap transcript payload from client checkpoint/finalize. */
export function validateTranscriptPayload(transcript: SavedMessage[]): SavedMessage[] {
  if (!Array.isArray(transcript)) {
    throw new Error("transcript must be an array");
  }

  if (transcript.length > MAX_SESSION_MESSAGES) {
    throw new Error(`Session cannot exceed ${MAX_SESSION_MESSAGES} messages`);
  }

  return transcript.map((message) => ({
    role: normalizeRole(String(message.role ?? "assistant")),
    content: String(message.content ?? "").slice(0, MAX_MESSAGE_CONTENT_CHARS),
  }));
}

export function estimateTranscriptPayloadBytes(transcript: SavedMessage[]): number {
  return JSON.stringify(transcript).length;
}

export function assertCheckpointPayloadSize(transcript: SavedMessage[]): void {
  const bytes = estimateTranscriptPayloadBytes(transcript);
  if (bytes > MAX_CHECKPOINT_PAYLOAD_BYTES) {
    throw new Error(
      `Checkpoint payload too large (${bytes} bytes, max ${MAX_CHECKPOINT_PAYLOAD_BYTES})`
    );
  }
}

export async function getSessionMessageCount(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("session_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message || "Failed to count session messages");
  return count ?? 0;
}

/** Append only new tail messages (client sends full chronological transcript). */
export async function appendSessionMessages(
  supabase: SupabaseClient,
  sessionId: string,
  transcript: SavedMessage[]
): Promise<number> {
  const sanitized = validateTranscriptPayload(transcript);
  const existingCount = await getSessionMessageCount(supabase, sessionId);

  if (sanitized.length <= existingCount) {
    return existingCount;
  }

  if (sanitized.length > MAX_SESSION_MESSAGES) {
    throw new Error(`Session cannot exceed ${MAX_SESSION_MESSAGES} messages`);
  }

  const toInsert = sanitized.slice(existingCount).map((message, index) => ({
    session_id: sessionId,
    seq: existingCount + index + 1,
    role: message.role,
    content: message.content,
  }));

  const { error } = await supabase.from("session_messages").insert(toInsert);
  if (error) throw new Error(error.message || "Failed to append session messages");

  return sanitized.length;
}

export async function listSessionMessages(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SavedMessage[]> {
  const { data, error } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("seq", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load session messages");
  return (data ?? []) as SavedMessage[];
}

/** Prefer append-only messages; fall back to legacy jsonb transcript. */
export async function loadSessionTranscript(
  supabase: SupabaseClient,
  sessionId: string,
  legacyTranscript?: SavedMessage[] | null
): Promise<SavedMessage[]> {
  const messages = await listSessionMessages(supabase, sessionId);
  if (messages.length > 0) return messages;
  return Array.isArray(legacyTranscript) ? legacyTranscript : [];
}

/** One-time migration: replace all messages for a session from jsonb transcript. */
export async function replaceSessionMessagesFromTranscript(
  supabase: SupabaseClient,
  sessionId: string,
  transcript: SavedMessage[]
): Promise<number> {
  const sanitized = validateTranscriptPayload(transcript);
  if (sanitized.length === 0) return 0;

  const { error: deleteError } = await supabase
    .from("session_messages")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to clear session messages");
  }

  const rows = sanitized.map((message, index) => ({
    session_id: sessionId,
    seq: index + 1,
    role: message.role,
    content: message.content,
  }));

  const { error: insertError } = await supabase.from("session_messages").insert(rows);
  if (insertError) {
    throw new Error(insertError.message || "Failed to migrate session messages");
  }

  return sanitized.length;
}
