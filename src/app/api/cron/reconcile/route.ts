import { reconcileStalePayments } from '@/lib/payments/settle';
import { expireStaleHolds } from '@/lib/booking/holds';
import { ok, fail, fromUnknownError } from '@/lib/api';

/**
 * Reconciliation sweep. Run every 10–15 minutes.
 *
 * Two jobs:
 *  1. Settle payments that are stuck mid-flight — the case where the browser
 *     closed AND the webhook was permanently lost. Without this, a customer who
 *     paid has no booking and no automated route to getting one
 *     (docs/research.md §4.2).
 *  2. Expire abandoned holds, promoting those with contact details into leads
 *     rather than discarding a warm buyer (§3.4).
 *
 * Protected by a bearer token. This endpoint can move booking state, so leaving
 * it open would let anyone trigger unbounded provider API calls.
 *
 * Vercel: add to vercel.json —
 *   { "crons": [{ "path": "/api/cron/reconcile", "schedule": "*\/10 * * * *" }] }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return fail('unauthorized', 'Not authorised.', 401);
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Refuse to run unauthenticated in production rather than silently
    // exposing it.
    return fail('unconfigured', 'CRON_SECRET is not set.', 503);
  }

  try {
    const [payments, releasedHolds] = await Promise.all([
      reconcileStalePayments(),
      expireStaleHolds(),
    ]);
    return ok({ payments, releasedHolds });
  } catch (error) {
    return fromUnknownError(error, 'cron/reconcile');
  }
}

export const GET = run;
export const POST = run;
