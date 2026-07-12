"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  deleteCompanionDocument,
  reprocessCompanionDocument,
  uploadCompanionDocument,
} from "@/lib/actions/document.actions";
import { MAX_PDF_BYTES } from "@/constants/rag";

interface DocumentUploadPanelProps {
  companionId: string;
  initialDocuments: CompanionDocument[];
  canUpload: boolean;
  documentLimit: number | null;
}

function statusLabel(status: CompanionDocument["status"]) {
  if (status === "ready") return "Ready";
  if (status === "failed") return "Failed";
  return "Processing";
}

export default function DocumentUploadPanel({
  companionId,
  initialDocuments,
  canUpload,
  documentLimit,
}: DocumentUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const limitText =
    documentLimit === null
      ? "Unlimited PDFs on your plan"
      : documentLimit === 0
        ? "Upgrade to Core Learner or Pro to upload PDF study materials"
        : `Up to ${documentLimit} PDF(s) per companion on your plan`;

  const handleUpload = (file: File | null) => {
    if (!file) return;
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("companionId", companionId);
        formData.set("file", file);

        const created = await uploadCompanionDocument(formData);
        setDocuments((current) => [created, ...current]);
        router.refresh();
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Upload failed";
        setError(message);
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  const handleDelete = (documentId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCompanionDocument(documentId);
        setDocuments((current) => current.filter((doc) => doc.id !== documentId));
        router.refresh();
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Delete failed";
        setError(message);
      }
    });
  };

  const handleRetry = (documentId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await reprocessCompanionDocument(documentId);
        router.refresh();
      } catch (retryError) {
        const message =
          retryError instanceof Error ? retryError.message : "Retry failed";
        setError(message);
      }
    });
  };

  return (
    <section className="section-card mt-8 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Study documents (PDF)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload PDFs to ground voice sessions in your material. {limitText}.
        </p>
      </div>

      {canUpload && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="text-sm"
            disabled={isPending}
            onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            PDF only, max {MAX_PDF_BYTES / (1024 * 1024)}MB. Text-based PDFs work best.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{document.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {statusLabel(document.status)}
                  {document.status === "ready" && document.chunk_count
                    ? ` · ${document.chunk_count} chunk(s)`
                    : ""}
                  {document.page_count ? ` · ${document.page_count} page(s)` : ""}
                </p>
                {document.status === "failed" && document.error_message && (
                  <p className="mt-1 text-sm text-destructive">{document.error_message}</p>
                )}
              </div>

              <div className="flex gap-2">
                {document.status === "failed" && (
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={isPending}
                    onClick={() => handleRetry(document.id)}
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(document.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
