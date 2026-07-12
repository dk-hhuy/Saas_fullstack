import {
  MAX_PDF_BYTES,
  MAX_PDF_PAGES,
} from "@/constants/rag";

export interface PdfExtractResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractResult> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds ${MAX_PDF_BYTES / (1024 * 1024)}MB limit`);
  }

  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer, { max: MAX_PDF_PAGES });

  const text = String(parsed.text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const pageCount = Number(parsed.numpages ?? 0);

  return { text, pageCount };
}
