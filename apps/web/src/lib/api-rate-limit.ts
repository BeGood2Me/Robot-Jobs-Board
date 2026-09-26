/**
 * Best-effort per-isolate rate limit for public JSON APIs.
 * Real enforcement is Vercel Firewall; this catches bursts on a warm instance.
 * Verified search crawlers are never limited.
 */
const GOOD_CRAWLERS = /Googlebot|Google-InspectionTool|bingbot|BingPreview|DuckDuckBot|Slurp|Applebot/i;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function isGoodCrawler(request: Request): boolean {
  const ua = request.headers.get('user-agent') ?? '';
  return GOOD_CRAWLERS.test(ua);
}

/** @returns null if allowed, or a Response if limited */
export function apiRateLimitResponse(
  request: Request,
  options: { limit?: number; windowMs?: number; name?: string } = {},
): Response | null {
  if (isGoodCrawler(request)) return null;

  const limit = options.limit ?? 90;
  const windowMs = options.windowMs ?? 60_000;
  const name = options.name ?? 'api';
  const ip = clientIp(request);
  const key = `${name}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return new Response(JSON.stringify({ error: 'Too many requests. Try again shortly.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'Cache-Control': 'no-store',
    },
  });
}
