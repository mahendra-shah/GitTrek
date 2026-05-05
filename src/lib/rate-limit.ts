/**
 * In-memory per-IP rate limiter for Next.js API routes.
 *
 * Uses a sliding window algorithm. Entries auto-evict after the window expires
 * so there's no memory leak from accumulating stale IPs.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
 */

type Entry = { count: number; windowStart: number };

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp ms
}

export function createRateLimiter(opts: { windowMs: number; max: number }) {
  const { windowMs, max } = opts;
  const store = new Map<string, Entry>();

  // Periodically sweep stale entries to prevent unbounded memory growth
  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart >= windowMs) store.delete(key);
    }
  };
  // Sweep every 5 minutes in server context
  if (typeof setInterval !== "undefined") {
    setInterval(sweep, 5 * 60 * 1000);
  }

  return {
    check(ip: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || now - entry.windowStart >= windowMs) {
        // New window
        store.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;
      const resetAt = entry.windowStart + windowMs;
      const remaining = Math.max(0, max - entry.count);
      return { allowed: entry.count <= max, remaining, resetAt };
    },
  };
}

/** Helper: extract client IP from Next.js request headers. */
export function getClientIp(request: Request): string {
  const headers = new Headers((request as Request & { headers: Headers }).headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
