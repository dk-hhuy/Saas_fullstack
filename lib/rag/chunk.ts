import {
  RAG_CHUNK_OVERLAP_CHARS,
  RAG_CHUNK_SIZE_CHARS,
} from "@/constants/rag";

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkText(text: string): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + RAG_CHUNK_SIZE_CHARS, normalized.length);
    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({
        index,
        content,
        tokenCount: estimateTokens(content),
      });
      index += 1;
    }

    if (end >= normalized.length) break;
    start = Math.max(end - RAG_CHUNK_OVERLAP_CHARS, start + 1);
  }

  return chunks;
}
