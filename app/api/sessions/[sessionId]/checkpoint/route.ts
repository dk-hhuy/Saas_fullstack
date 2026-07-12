import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CHECKPOINT_RATE_LIMIT_MS } from "@/constants/rate-limit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";
import { updateSessionCheckpoint } from "@/lib/session-persistence";
import {
  assertCheckpointPayloadSize,
  validateTranscriptPayload,
} from "@/lib/session-messages";

interface CheckpointBody {
  transcript?: SavedMessage[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`checkpoint:${userId}`, CHECKPOINT_RATE_LIMIT_MS);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterMs);
  }

  const { sessionId } = await params;

  let body: CheckpointBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript = body.transcript;
  if (!Array.isArray(transcript)) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  try {
    assertCheckpointPayloadSize(transcript);
    validateTranscriptPayload(transcript);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid transcript";
    const status = message.includes("too large") ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const supabase = createAuthenticatedSupabaseClient();
    const result = await updateSessionCheckpoint(
      supabase,
      userId,
      sessionId,
      transcript
    );

    if (!result) {
      return NextResponse.json({ error: "Session not found or already ended" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, durationSeconds: result.durationSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkpoint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
