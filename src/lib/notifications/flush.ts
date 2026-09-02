import 'server-only';
import { after } from 'next/server';
import { processOutbox } from './email';
import { processWhatsAppOutbox } from './whatsapp';

/**
 * Send the queued messages for THIS request, as soon as the response is out.
 *
 * WHY THIS EXISTS
 *
 * The outbox is queue-first for a good reason: sending inline from the Razorpay
 * webhook means an SMTP or WhatsApp failure either loses the notification or
 * returns non-2xx — and a non-2xx makes Razorpay redeliver the payment event
 * forever (research §4.3.3).
 *
 * But "do not send inline" was quietly turned into "only a cron may send",
 * which is a different and worse rule. It made every booking confirmation wait
 * for the next scheduled sweep, and it put the whole feature behind a paid
 * Vercel plan, because Hobby caps cron at once per day.
 *
 * `after()` gives us both. The callback runs AFTER the response has been sent,
 * so nothing it does can change the status code Razorpay sees — the property
 * the queue was protecting — while the message still goes out within seconds of
 * the payment instead of up to a scheduling interval later.
 *
 * WHAT THIS DOES NOT REPLACE
 *
 * The periodic sweep is still required, for two things `after()` cannot do:
 *
 *   · REMINDERS. A row scheduled for 24 hours before an appointment has nothing
 *     to wake it up. `after()` finishes with the request.
 *   · RETRIES. If a send fails here, the row is left `failed` and needs someone
 *     to come back for it.
 *
 * So this is the fast path, not the only path. Losing it delays messages;
 * losing the sweep loses reminders. See docs/cron-setup.md.
 */
export function flushOutboxAfterResponse(): void {
  try {
    after(async () => {
      try {
        await Promise.allSettled([processOutbox(5), processWhatsAppOutbox(5)]);
      } catch (error) {
        // Never rethrow. This runs detached from the response; an unhandled
        // rejection here can take down the whole invocation, and the sweep
        // will pick the rows up regardless.
        console.error('[outbox] immediate flush failed', error);
      }
    });
  } catch {
    /*
     * `after()` throws outside a request scope — a script, a test, a direct
     * call from the reconcile job in some future refactor. That is not an
     * error worth surfacing: the message is already durably queued, and the
     * sweep will send it. Silently doing nothing is the correct fallback.
     */
  }
}
