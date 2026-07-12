import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DOCUMENT_PROCESS_RATE_LIMIT_MS } from "@/constants/rag";
import { processCompanionDocument } from "@/lib/rag/process-document";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(
    `doc-process:${userId}`,
    DOCUMENT_PROCESS_RATE_LIMIT_MS
  );
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterMs);
  }

  const { id: documentId } = await params;

  try {
    const supabase = createAuthenticatedSupabaseClient();
    const result = await processCompanionDocument(supabase, documentId, userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
