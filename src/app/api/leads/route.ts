import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/session';
import { contactSchema } from '@/lib/validation/schemas';
import { queueNotification } from '@/lib/notifications/outbox';
import { ok, fail, fromZodError, fromUnknownError } from '@/lib/api';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';

/**
 * Contact form.
 *
 * Anonymous by design. Two spam controls, both cheap:
 *   - a honeypot field (`website`) that must be empty; bots fill every input
 *   - per-IP rate limiting
 *
 * Neither is a CAPTCHA, deliberately. A CAPTCHA on a small practitioner's
 * contact form costs more conversions than the spam it prevents, and the admin
 * Leads screen makes deleting the occasional junk entry a two-second job.
 */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`lead:${ip}`, LIMITS.contactForm.limit, LIMITS.contactForm.windowMs);
    if (!limit.allowed) {
      return fail('rate_limited', 'You have sent several messages already. Please call us instead.', 429);
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    // Honeypot tripped: respond exactly as if it succeeded, so the bot learns
    // nothing about the filter.
    if (parsed.data.website) return ok({ received: true });

    const user = await getCurrentUser();
    const url = new URL(request.url);

    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        service_id: parsed.data.serviceId || null,
        source: 'contact_form',
        status: 'new',
        user_id: user?.id ?? null,
        utm_source: url.searchParams.get('utm_source'),
        utm_medium: url.searchParams.get('utm_medium'),
        utm_campaign: url.searchParams.get('utm_campaign'),
      })
      .select('id')
      .single();

    if (error) return fromUnknownError(error, 'leads:insert');

    if (parsed.data.email) {
      await queueNotification({
        template: 'lead_received',
        dedupeKey: `lead_ack:${lead.id}`,
        recipient: parsed.data.email,
        payload: { appointment: { name: parsed.data.name } },
      });
    }

    return ok({ received: true });
  } catch (error) {
    return fromUnknownError(error, 'leads');
  }
}
