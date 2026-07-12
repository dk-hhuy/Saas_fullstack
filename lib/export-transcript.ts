export interface TranscriptExportMeta {
  companionName: string;
  companionTopic: string;
  companionSubject: string;
  userName: string;
  sessionDate: string;
  durationMinutes: number;
  summary?: string | null;
}

function formatSpeaker(
  role: SavedMessage["role"],
  companionName: string,
  userName: string
) {
  if (role === "assistant") return companionName.split(" ")[0];
  if (role === "user") return userName;
  return "System";
}

export function buildTranscriptMarkdown(
  messages: SavedMessage[],
  meta: TranscriptExportMeta
) {
  const lines = [
    `# ${meta.companionName}`,
    "",
    `**Topic:** ${meta.companionTopic}`,
    `**Subject:** ${meta.companionSubject}`,
    `**Date:** ${meta.sessionDate}`,
    `**Duration:** ${meta.durationMinutes} min`,
    "",
  ];

  if (meta.summary) {
    lines.push("## Summary", "", meta.summary, "");
  }

  lines.push("## Transcript", "");

  for (const message of messages) {
    const speaker = formatSpeaker(
      message.role,
      meta.companionName,
      meta.userName
    );
    lines.push(`**${speaker}:** ${message.content}`, "");
  }

  return lines.join("\n").trimEnd();
}

export function buildTranscriptPlainText(
  messages: SavedMessage[],
  meta: TranscriptExportMeta
) {
  const lines = [
    `${meta.companionName}`,
    `Topic: ${meta.companionTopic}`,
    `Subject: ${meta.companionSubject}`,
    `Date: ${meta.sessionDate}`,
    `Duration: ${meta.durationMinutes} min`,
    "",
  ];

  if (meta.summary) {
    lines.push("Summary", meta.summary, "");
  }

  lines.push("Transcript", "");

  for (const message of messages) {
    const speaker = formatSpeaker(
      message.role,
      meta.companionName,
      meta.userName
    );
    lines.push(`${speaker}: ${message.content}`, "");
  }

  return lines.join("\n").trimEnd();
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTranscriptPrintHtml(
  messages: SavedMessage[],
  meta: TranscriptExportMeta
) {
  const transcriptHtml = messages
    .map((message) => {
      const speaker = formatSpeaker(
        message.role,
        meta.companionName,
        meta.userName
      );
      return `<p><strong>${escapeHtml(speaker)}:</strong> ${escapeHtml(message.content)}</p>`;
    })
    .join("");

  const summaryHtml = meta.summary
    ? `<h2>Summary</h2><p>${escapeHtml(meta.summary)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.companionName)} — Transcript</title>
    <style>
      body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 24px; color: #111; }
      h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
      .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
      h2 { font-size: 1.1rem; margin-top: 1.5rem; }
      p { margin: 0.5rem 0; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(meta.companionName)}</h1>
    <div class="meta">
      <div>Topic: ${escapeHtml(meta.companionTopic)}</div>
      <div>Subject: ${escapeHtml(meta.companionSubject)}</div>
      <div>Date: ${escapeHtml(meta.sessionDate)}</div>
      <div>Duration: ${meta.durationMinutes} min</div>
    </div>
    ${summaryHtml}
    <h2>Transcript</h2>
    ${transcriptHtml}
  </body>
</html>`;
}

export function printTranscript(
  messages: SavedMessage[],
  meta: TranscriptExportMeta
) {
  const html = buildTranscriptPrintHtml(messages, meta);
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
