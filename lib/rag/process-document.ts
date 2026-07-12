import type { SupabaseClient } from "@supabase/supabase-js";
import { RAG_BUCKET } from "@/constants/rag";
import { extractTextFromPdf } from "@/lib/pdf/extract-text";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

interface DocumentRow {
  id: string;
  companion_id: string;
  author: string;
  storage_path: string;
  status: string;
}

async function markDocumentFailed(
  supabase: SupabaseClient,
  documentId: string,
  message: string
) {
  await supabase
    .from("companion_documents")
    .update({
      status: "failed",
      error_message: message.slice(0, 500),
    })
    .eq("id", documentId);
}

export async function processCompanionDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
) {
  const { data: document, error } = await supabase
    .from("companion_documents")
    .select("id, companion_id, author, storage_path, status")
    .eq("id", documentId)
    .eq("author", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!document) throw new Error("Document not found");

  const row = document as DocumentRow;

  await supabase
    .from("companion_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentId);

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(RAG_BUCKET)
      .download(row.storage_path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || "Failed to download PDF");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text, pageCount } = await extractTextFromPdf(buffer);

    if (!text) {
      throw new Error(
        "No extractable text found in PDF. Scanned documents are not supported yet."
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw new Error("Document produced no text chunks");
    }

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    const chunkRows = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: embeddings[index],
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(chunkRows);

    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await supabase
      .from("companion_documents")
      .update({
        status: "ready",
        page_count: pageCount,
        chunk_count: chunks.length,
        error_message: null,
      })
      .eq("id", documentId);

    if (updateError) throw new Error(updateError.message);

    return {
      documentId,
      chunkCount: chunks.length,
      pageCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await markDocumentFailed(supabase, documentId, message);
    throw error;
  }
}
