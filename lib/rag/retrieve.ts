import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_RAG_CONTEXT_CHARS, RAG_TOP_K } from "@/constants/rag";
import { embedQuery } from "@/lib/rag/embed";

export interface RetrievedChunk {
  chunkId: string;
  content: string;
  similarity: number;
}

export async function searchChunks(
  supabase: SupabaseClient,
  companionId: string,
  query: string,
  k = RAG_TOP_K
): Promise<RetrievedChunk[]> {
  const embedding = await embedQuery(query);
  if (!embedding) return [];

  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_companion_id: companionId,
    p_query_embedding: embedding,
    p_match_count: k,
  });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row: { chunk_id: string; content: string; similarity: number }) => ({
      chunkId: row.chunk_id,
      content: row.content,
      similarity: row.similarity,
    })
  );
}

export function formatRagContext(chunks: RetrievedChunk[]): string | null {
  if (chunks.length === 0) return null;

  const parts: string[] = [];
  let total = 0;

  for (const chunk of chunks) {
    const snippet = chunk.content.trim();
    if (!snippet) continue;

    const next = `- ${snippet}`;
    if (total + next.length > MAX_RAG_CONTEXT_CHARS) break;
    parts.push(next);
    total += next.length + 1;
  }

  if (parts.length === 0) return null;

  return parts.join("\n");
}

export async function buildCompanionRagContext(
  supabase: SupabaseClient,
  companionId: string,
  query: string
): Promise<string | null> {
  const chunks = await searchChunks(supabase, companionId, query);
  return formatRagContext(chunks);
}
