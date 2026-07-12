import { SLOW_QUERY_WARN_MS } from "@/constants/rate-limit";

export async function withSlowQueryWarning<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;

  if (process.env.NODE_ENV === "development" && elapsed >= SLOW_QUERY_WARN_MS) {
    console.warn(`[slow query] ${label} took ${elapsed}ms`);
  }

  return result;
}
