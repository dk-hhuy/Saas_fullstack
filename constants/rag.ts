/** Gemini gemini-embedding-001 output dimension (via outputDimensionality). */
export const RAG_EMBEDDING_DIM = 768;

export const RAG_BUCKET = "companion-docs";

/** Max PDF upload size (10 MB). */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** Max pages extracted from a PDF. */
export const MAX_PDF_PAGES = 100;

/** Approximate characters per chunk (~500 tokens). */
export const RAG_CHUNK_SIZE_CHARS = 2_000;

/** Overlap between chunks (~50 tokens). */
export const RAG_CHUNK_OVERLAP_CHARS = 200;

/** Max context injected into the voice system prompt. */
export const MAX_RAG_CONTEXT_CHARS = 4_000;

/** Top-k chunks retrieved per session. */
export const RAG_TOP_K = 5;

/** Embed API batch size. */
export const RAG_EMBED_BATCH_SIZE = 16;

/** Min interval between document processing per user. */
export const DOCUMENT_PROCESS_RATE_LIMIT_MS = 5 * 60 * 1_000;

export const GEMINI_EMBED_MODEL = "gemini-embedding-001";
