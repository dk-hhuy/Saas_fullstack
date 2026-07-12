type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

interface RateLimitEntry {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, RateLimitEntry>();

/** In-memory fixed-window rate limiter (per server instance). */
export function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests = 1
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    pruneBuckets();
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs: Math.max(1, retryAfterMs) };
  }

  entry.count += 1;
  return { allowed: true };
}

function pruneBuckets() {
  if (buckets.size <= 10_000) return;
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, entry] of buckets) {
    if (entry.windowStart < cutoff) buckets.delete(key);
  }
}

export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfterSec }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
