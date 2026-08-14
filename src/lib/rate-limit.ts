import 'server-only';

/**
 * In-memory fixed-window rate limiter.
 *
 * SCOPE, honestly stated: this is per-process. On a single instance (which is
 * what this business will run on) it does its job — stopping form spam and
 * brute-force attempts on the endpoints that matter. Behind multiple instances
 * it degrades to per-instance limiting.
 *
 * It is deliberately not a distributed limiter, because adding Redis to a solo
 * practitioner's stack for this is the kind of enterprise complexity the brief
 * asks us to avoid. If you scale horizontally, swap the Map for Upstash Redis —
 * the call signature is designed not to change.
 *
 * This is defence in depth, not the primary control. The primary controls are
 * RLS, server-side verification, and idempotency.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client IP. Behind Vercel/Cloudflare `x-forwarded-for` is set by
 * the platform and the client cannot forge the leftmost entry. Behind a bare
 * origin it is spoofable — which is why rate limiting is not the primary
 * security control here.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'unknown';
}

/** Tuned per endpoint by how expensive and how abusable each one is. */
export const LIMITS = {
  contactForm:   { limit: 5,  windowMs: 10 * 60_000 },
  createHold:    { limit: 20, windowMs: 5 * 60_000 },
  createOrder:   { limit: 10, windowMs: 10 * 60_000 },
  verifyPayment: { limit: 30, windowMs: 5 * 60_000 },
  auth:          { limit: 10, windowMs: 10 * 60_000 },
  adminMutation: { limit: 60, windowMs: 60_000 },
} as const;
