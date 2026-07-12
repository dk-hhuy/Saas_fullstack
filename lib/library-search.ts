/** Escape special chars for PostgREST ilike / or() filters. */
export function sanitizeLibrarySearchTerm(raw: string): string {
  return String(raw)
    .trim()
    .slice(0, 100)
    .replace(/[%_,()]/g, "");
}

export function isSearchableTerm(term?: string | string[]): term is string {
  return typeof term === "string" && sanitizeLibrarySearchTerm(term).length > 0;
}
