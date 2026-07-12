"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { DOCUMENT_PROCESS_RATE_LIMIT_MS, MAX_PDF_BYTES, RAG_BUCKET } from "@/constants/rag";
import { getDocumentLimitPerCompanion } from "@/lib/plan-access";
import { buildCompanionRagContext } from "@/lib/rag/retrieve";
import { processCompanionDocument } from "@/lib/rag/process-document";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";

async function assertCompanionOwner(companionId: string, userId: string) {
  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select("id, author")
    .eq("id", companionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.author !== userId) {
    throw new Error("Companion not found or access denied");
  }
}

export async function listCompanionDocuments(companionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  await assertCompanionOwner(companionId, userId);

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("companion_documents")
    .select(
      "id, companion_id, file_name, page_count, chunk_count, status, error_message, created_at"
    )
    .eq("companion_id", companionId)
    .eq("author", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CompanionDocument[];
}

export async function uploadCompanionDocument(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const companionId = String(formData.get("companionId") ?? "");
  const file = formData.get("file");

  if (!companionId) throw new Error("companionId is required");
  if (!(file instanceof File)) throw new Error("PDF file is required");
  if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed");
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`PDF must be ${MAX_PDF_BYTES / (1024 * 1024)}MB or smaller`);
  }

  const rate = checkRateLimit(
    `doc-process:${userId}`,
    DOCUMENT_PROCESS_RATE_LIMIT_MS
  );
  if (!rate.allowed) {
    throw new Error("Please wait before uploading another document");
  }

  await assertCompanionOwner(companionId, userId);

  const limit = await getDocumentLimitPerCompanion();
  const supabase = createAuthenticatedSupabaseClient();

  if (limit !== null) {
    const { count, error: countError } = await supabase
      .from("companion_documents")
      .select("id", { count: "exact", head: true })
      .eq("companion_id", companionId)
      .eq("author", userId)
      .neq("status", "failed");

    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= limit) {
      throw new Error(`Your plan allows up to ${limit} document(s) per companion`);
    }
  }

  const documentId = crypto.randomUUID();
  const storagePath = `${userId}/${companionId}/${documentId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(RAG_BUCKET)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: row, error: insertError } = await supabase
    .from("companion_documents")
    .insert({
      id: documentId,
      companion_id: companionId,
      author: userId,
      file_name: file.name,
      storage_path: storagePath,
      status: "processing",
    })
    .select("id, file_name, status, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(RAG_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  try {
    await processCompanionDocument(supabase, documentId, userId);
  } catch (error) {
    revalidatePath(`/companions/${companionId}/edit`);
    throw error;
  }

  revalidatePath(`/companions/${companionId}/edit`);
  revalidatePath(`/companions/${companionId}`);

  return row as CompanionDocument;
}

export async function deleteCompanionDocument(documentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const supabase = createAuthenticatedSupabaseClient();
  const { data: document, error } = await supabase
    .from("companion_documents")
    .select("id, companion_id, storage_path, author")
    .eq("id", documentId)
    .eq("author", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!document) throw new Error("Document not found");

  await supabase.storage.from(RAG_BUCKET).remove([document.storage_path]);

  const { error: deleteError } = await supabase
    .from("companion_documents")
    .delete()
    .eq("id", documentId)
    .eq("author", userId);

  if (deleteError) throw new Error(deleteError.message);

  revalidatePath(`/companions/${document.companion_id}/edit`);
  revalidatePath(`/companions/${document.companion_id}`);
}

export async function getCompanionRagContext(companionId: string, query: string) {
  const { userId } = await auth();
  if (!userId) return null;

  if (!process.env.GEMINI_API_KEY) return null;

  const supabase = createAuthenticatedSupabaseClient();

  try {
    return await buildCompanionRagContext(supabase, companionId, query);
  } catch (error) {
    console.error("RAG context retrieval failed", error);
    return null;
  }
}

export async function reprocessCompanionDocument(documentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");

  const rate = checkRateLimit(
    `doc-process:${userId}`,
    DOCUMENT_PROCESS_RATE_LIMIT_MS
  );
  if (!rate.allowed) {
    throw new Error("Please wait before processing another document");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const result = await processCompanionDocument(supabase, documentId, userId);

  const { data: document } = await supabase
    .from("companion_documents")
    .select("companion_id")
    .eq("id", documentId)
    .maybeSingle();

  if (document?.companion_id) {
    revalidatePath(`/companions/${document.companion_id}/edit`);
    revalidatePath(`/companions/${document.companion_id}`);
  }

  return result;
}
