import { processOutbox } from '@/lib/notifications/email';
import { ok, fail, fromUnknownError } from '@/lib/api';

/**
 * Outbox worker. Run every 1–5 minutes.
 *
 * Sends queued email — confirmations, reminders, refund notices. Kept separate
 * from the payment path on purpose: an SMTP outage must never be able to affect
 * whether a payment settles (docs/research.md §4.3.3).
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
    return ok(await processOutbox());
  } catch (error) {
    return fromUnknownError(error, 'cron/notifications');
  }
}

export const GET = run;
export const POST = run;
