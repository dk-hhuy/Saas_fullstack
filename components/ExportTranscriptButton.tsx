"use client";

import { Download, FileText, Printer } from "lucide-react";
import {
  buildTranscriptMarkdown,
  buildTranscriptPlainText,
  downloadTextFile,
  printTranscript,
  slugifyFilename,
  type TranscriptExportMeta,
} from "@/lib/export-transcript";

interface ExportTranscriptButtonProps {
  messages: SavedMessage[];
  meta: TranscriptExportMeta;
}

const ExportTranscriptButton = ({
  messages,
  meta,
}: ExportTranscriptButtonProps) => {
  if (messages.length === 0) return null;

  const baseName = slugifyFilename(
    `${meta.companionName}-${meta.sessionDate}`
  );

  const exportMarkdown = () => {
    const content = buildTranscriptMarkdown(messages, meta);
    downloadTextFile(content, `${baseName}.md`, "text/markdown;charset=utf-8");
  };

  const exportPlainText = () => {
    const content = buildTranscriptPlainText(messages, meta);
    downloadTextFile(content, `${baseName}.txt`, "text/plain;charset=utf-8");
  };

  const exportPdf = () => {
    printTranscript(messages, meta);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={exportMarkdown}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
      >
        <Download size={15} />
        Export Markdown
      </button>
      <button
        type="button"
        onClick={exportPlainText}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
      >
        <FileText size={15} />
        Export Text
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
      >
        <Printer size={15} />
        Print / PDF
      </button>
    </div>
  );
};

export default ExportTranscriptButton;
