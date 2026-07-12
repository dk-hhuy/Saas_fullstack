/**
 * Build /companions URLs while preserving filter, topic, subject, sort.
 * Resets pagination by default when search/filter changes.
 */
export function buildCompanionsUrl(
  current: URLSearchParams | string,
  updates: Record<string, string | null | undefined>,
  options: { resetPage?: boolean } = { resetPage: true }
) {
  const params = new URLSearchParams(
    typeof current === "string" ? current : current.toString()
  );

  if (options.resetPage !== false) {
    params.delete("page");
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/companions?${query}` : "/companions";
}
