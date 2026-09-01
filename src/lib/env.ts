import 'server-only';
import { z } from 'zod';

/**
 * Server-side environment contract.
 *
 * Validated once, at first call, so a missing *required* var fails loudly
 * immediately instead of silently mid-request. Razorpay's three vars are the
 * exception — optional here so that unrelated server code (createAdminClient()
 * role lookups on /login, for instance) isn't forced to have payments
 * configured just to boot. Payment code still fails loudly on a missing
 * secret, just at the point it actually needs one — see
 * requireRazorpayEnv() in lib/payments/razorpay.ts, and isPaymentsConfigured()
 * below for the non-throwing check used by surfaces that render either way.
 *
 * `server-only` makes it a build error to import this from a Client Component,
 * which is the mechanism that guarantees secrets cannot be bundled into
 * browser JavaScript.
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

  /**
   * Optional at the schema level so that code with nothing to do with payments
   * (createAdminClient() role lookups on /login, for instance) doesn't fail to
   * boot just because Razorpay isn't configured yet. Payment code itself still
   * fails loudly — see requireRazorpayEnv() in lib/payments/razorpay.ts and
   * isPaymentsConfigured() below for the two ways call sites enforce that.
   */
  RAZORPAY_KEY_ID: z.string().startsWith('rzp_').optional(),
  RAZORPAY_KEY_SECRET: z.string().min(10).optional(),
  /** Set in the Razorpay dashboard when creating the webhook. NOT the API secret. */
  RAZORPAY_WEBHOOK_SECRET: z.string().min(8).optional(),

  /** Shared secret for /api/cron/* so the reconciliation job is not public. */
  CRON_SECRET: z.string().min(16).optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  /** Tax in basis points. 1800 = 18% GST. 0 = prices are tax-inclusive. */
  TAX_BPS: z.coerce.number().int().min(0).max(10000).default(0),

  /** Email delivery. Optional: without it the outbox queues but does not send. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  /**
   * WhatsApp delivery. All optional, and the default is OFF.
   *
   * Unset means booking confirmations queue on the `whatsapp` channel and stay
   * queued — visible in notification_outbox, logged by the worker, never marked
   * sent. They deliver themselves once these land. See docs/whatsapp-setup.md.
   *
   * SERVER ONLY. WHATSAPP_ACCESS_TOKEN can send messages as the practice to
   * anyone; in a browser bundle it is simply published.
   */
  WHATSAPP_PROVIDER: z.enum(['meta']).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_TEMPLATE_LANG: z.string().optional(),
  /** Where Komal's own copy of each booking goes. Falls back to BRAND.phones. */
  WHATSAPP_ADMIN_TO: z.string().optional(),

  /**
   * Signs the booking links that let a client open their confirmation without
   * an account. Optional: lib/booking/access-token.ts derives a key from the
   * service-role key when unset, so links keep working on a deployment where
   * this has not been set yet. Rotating it invalidates every outstanding link.
   */
  BOOKING_LINK_SECRET: z.string().min(16).optional(),

  /**
   * Prokerala, for the free astrology tools. Optional at the schema level so
   * the rest of the app boots without them — the tools then render an honest
   * "not connected yet" state rather than a broken form, and every other route
   * is unaffected. See docs/astrology-setup.md for where to get these.
   *
   * SERVER ONLY. Neither is NEXT_PUBLIC_, and neither may become so: these are
   * client-credentials, and in a browser bundle they are simply published.
   */
  PROKERALA_CLIENT_ID: z.string().optional(),
  PROKERALA_CLIENT_SECRET: z.string().optional(),
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
