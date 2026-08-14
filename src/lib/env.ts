import 'server-only';
import { z } from 'zod';

/**
 * Server-side environment contract.
 *
 * Validated once, at first import, so a missing Razorpay secret fails loudly at
 * boot instead of silently at 2am during a real payment. `server-only` makes it
 * a build error to import this from a Client Component, which is the mechanism
 * that guarantees secrets cannot be bundled into browser JavaScript.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),

  /**
   * Bypasses RLS entirely. Used only by src/lib/supabase/admin.ts, which is
   * itself server-only. If this ever appears in a client bundle, every row in
   * the database is public.
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  RAZORPAY_KEY_ID: z.string().startsWith('rzp_'),
  RAZORPAY_KEY_SECRET: z.string().min(10),
  /** Set in the Razorpay dashboard when creating the webhook. NOT the API secret. */
  RAZORPAY_WEBHOOK_SECRET: z.string().min(8),

  /** Shared secret for /api/cron/* so the reconciliation job is not public. */
  CRON_SECRET: z.string().min(16).optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  /** Tax in basis points. 1800 = 18% GST. 0 = prices are tax-inclusive. */
  TAX_BPS: z.coerce.number().int().min(0).max(10000).default(0),

  /** Email delivery. Optional: without it the outbox queues but does not send. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing environment variables:\n${missing}\n\n` +
        `Copy .env.example to .env.local and fill in the values.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * Non-throwing check, for surfaces that must still render when payments are not
 * yet configured (e.g. a local dev homepage). Never used on a payment path.
 */
export function isPaymentsConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET,
  );
}
