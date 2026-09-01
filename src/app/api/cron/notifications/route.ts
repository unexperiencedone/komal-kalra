import { processOutbox } from '@/lib/notifications/email';
import { processWhatsAppOutbox } from '@/lib/notifications/whatsapp';
import { ok, fail, fromUnknownError } from '@/lib/api';

/**
 * Outbox worker. Run every 1–5 minutes.
 *
 * Sends queued email and WhatsApp — confirmations, reminders, refund notices.
 * Kept separate from the payment path on purpose: an SMTP or WhatsApp outage
 * must never be able to affect whether a payment settles (research §4.3.3).
 *
 * The two channels drain INDEPENDENTLY, with `allSettled` rather than `all`.
 * They share a table but not a fate: if Meta is down, the email confirmations
 * queued behind it must still go out, and a rejected promise from one channel
 * would otherwise abandon the other mid-batch. Both summaries are returned so a
 * glance at the cron log says which side is stuck.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return fail('unauthorized', 'Not authorised.', 401);
    }
  } else if (process.env.NODE_ENV === 'production') {
    return fail('unconfigured', 'CRON_SECRET is not set.', 503);
  }

  try {
    const [email, whatsapp] = await Promise.allSettled([
      processOutbox(),
      processWhatsAppOutbox(),
    ]);

    const unwrap = (r: PromiseSettledResult<unknown>) =>
      r.status === 'fulfilled'
        ? r.value
        : { error: r.reason instanceof Error ? r.reason.message : String(r.reason) };

    return ok({ email: unwrap(email), whatsapp: unwrap(whatsapp) });
  } catch (error) {
    return fromUnknownError(error, 'cron/notifications');
  }
}

export const GET = run;
export const POST = run;
