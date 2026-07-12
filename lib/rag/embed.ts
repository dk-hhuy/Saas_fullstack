import {
  GEMINI_EMBED_MODEL,
  RAG_EMBED_BATCH_SIZE,
  RAG_EMBEDDING_DIM,
} from "@/constants/rag";

const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:batchEmbedContents`;

async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${GEMINI_EMBED_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: RAG_EMBEDDING_DIM,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini embed failed: ${body}`);
  }

  const data = await response.json();
  const embeddings = (data.embeddings ?? []).map(
    (item: { values?: number[] }) => item.values ?? []
  );

  if (embeddings.length !== texts.length) {
    throw new Error("Gemini embed returned unexpected batch size");
  }

  return embeddings;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (texts.length === 0) return [];

  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += RAG_EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + RAG_EMBED_BATCH_SIZE);
    const vectors = await embedBatch(batch, apiKey);
    results.push(...vectors);
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  const [vector] = await embedTexts([text]);
  return vector ?? null;
}
