import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from './razorpay';
import { queueNotification } from '@/lib/notifications/outbox';
import { adminWhatsAppNumber } from '@/lib/notifications/whatsapp';
import type { ConfirmResult, Payment } from '@/types/database';

/**
 * Settlement — the one place a payment becomes `paid`.
 *
 * Called from THREE independent paths (docs/research.md §4.2):
 *   1. /api/payments/verify   — the browser handler, fast, unreliable
 *   2. /api/payments/webhook  — Razorpay's retrying delivery, the source of truth
 *   3. /api/cron/reconcile    — a sweep for anything the other two lost
 *
 * All three funnel into `confirm_appointment_payment()`, whose conditional
 * UPDATE makes the operation idempotent: whichever path arrives first performs
 * the transition, and later arrivals get `already_confirmed` and fire no side
 * effects. That property is what makes it safe for these three to race.
 */

export interface SettleOutcome {
  status: 'confirmed' | 'duplicate' | 'conflict' | 'mismatch' | 'error';
  appointmentId?: string;
  reference?: string;
  message?: string;
}

export async function settlePayment(params: {
  paymentId: string;
  providerPaymentId: string;
  amountPaise: number;
  method?: string | null;
  signature?: string | null;
  source: 'verify' | 'webhook' | 'reconcile';
}): Promise<SettleOutcome> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('confirm_appointment_payment', {
    p_payment_id: params.paymentId,
    p_provider_payment_id: params.providerPaymentId,
    p_amount_paise: params.amountPaise,
    p_method: params.method ?? null,
    p_signature: params.signature ?? null,
  });

  if (error) {
    console.error('[settle] rpc failed', { source: params.source, error });
    return { status: 'error', message: 'Could not settle the payment' };
  }

  const result = data as ConfirmResult;

  switch (result.result) {
    case 'confirmed': {
      // Side effects run ONLY on a genuine first confirmation. Queued, not sent
      // inline: an SMTP failure must never change the HTTP status of a webhook,
      // or Razorpay will redeliver the payment event forever (research §4.3.3).
      await queueNotification({
        template: 'booking_confirmed',
        appointmentId: result.appointment_id,
        dedupeKey: `booking_confirmed:${result.appointment_id}`,
      });

      /**
       * The same confirmation on WhatsApp.
       *
       * A SEPARATE ROW, not a second channel on the first one. Each outbox row
       * is one delivery attempt with one status and one dedupe key, so email
       * and WhatsApp succeed or fail independently — a WhatsApp template
       * rejection must not mark the email as failed, and a bounced email must
       * not stop the WhatsApp message. The dedupe keys are namespaced by
       * channel for the same reason.
       *
       * `recipient` is left unset so queueNotification resolves it from the
       * appointment's own contact_phone; see database/29_booking_contact.sql
       * for why that is not read off the profile.
       */
      await queueNotification({
        template: 'booking_confirmed',
        channel: 'whatsapp',
        appointmentId: result.appointment_id,
        dedupeKey: `booking_confirmed_wa:${result.appointment_id}`,
      });

      /**
       * Komal's own copy, to her WhatsApp.
       *
       * The practice asked for booking details to reach BOTH sides. This is a
       * different template from the client's — it carries the client's phone
       * number and what they want to discuss, which the client's own message
       * obviously must not, and it addresses her rather than them.
       *
       * If no admin number is configured this is skipped rather than queued to
       * a guess. Sending a stranger the name, number and personal question of
       * every client who books would be a data breach, not a misconfiguration.
       */
      const adminTo = adminWhatsAppNumber();
      if (adminTo) {
        await queueNotification({
          template: 'booking_alert_admin',
          channel: 'whatsapp',
          recipient: adminTo,
          appointmentId: result.appointment_id,
          dedupeKey: `booking_alert_admin:${result.appointment_id}`,
        });
      } else {
        console.warn('[settle] no WhatsApp admin number configured; practitioner alert skipped');
      }

      await queueNotification({
        template: 'appointment_reminder',
        appointmentId: result.appointment_id,
        dedupeKey: `reminder_24h:${result.appointment_id}`,
        offsetHoursBeforeStart: 24,
      });
      await queueNotification({
        template: 'appointment_reminder',
        channel: 'whatsapp',
        appointmentId: result.appointment_id,
        dedupeKey: `reminder_24h_wa:${result.appointment_id}`,
        offsetHoursBeforeStart: 24,
      });
      return {
        status: 'confirmed',
        appointmentId: result.appointment_id,
        reference: result.reference,
      };
    }

    case 'already_confirmed':
      return { status: 'duplicate', appointmentId: result.appointment_id };

    case 'slot_conflict':
      // Money was taken but the slot could not be secured. The appointment is
      // now `needs_attention` and appears in the admin "Pending actions" list
      // for refund. We never silently keep money for a booking that does not
      // exist (research §5.4).
      console.error('[settle] SLOT CONFLICT — refund required', {
        paymentId: params.paymentId,
        appointmentId: result.appointment_id,
      });
      await queueNotification({
        template: 'booking_needs_attention',
        appointmentId: result.appointment_id,
        dedupeKey: `needs_attention:${result.appointment_id}`,
      });
      return {
        status: 'conflict',
        appointmentId: result.appointment_id,
        message: 'Payment received, but that time was no longer available.',
      };

    case 'amount_mismatch':
      console.error('[settle] AMOUNT MISMATCH', result);
      return {
        status: 'mismatch',
        message: `Expected ${result.expected} paise, provider reported ${result.received}.`,
      };

    default:
      console.error('[settle] unexpected result', result);
      return { status: 'error', message: 'Payment could not be confirmed.' };
  }
}

export async function failPayment(params: {
  paymentId: string;
  errorCode?: string | null;
  errorDescription?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('fail_appointment_payment', {
    p_payment_id: params.paymentId,
    p_error_code: params.errorCode ?? null,
    p_error_description: params.errorDescription ?? null,
  });
  if (error) console.error('[failPayment]', error);
  return data as { result: string } | null;
}

/**
 * Reconciliation.
 *
 * The safety net for the case where the browser closed AND the webhook was
 * permanently lost. Re-fetches anything stuck mid-flight directly from the
 * provider and settles it from the authoritative source.
 *
 * Without this, a lost webhook means a customer who paid has no booking and no
 * automated path to getting one.
 */
export async function reconcileStalePayments(olderThanMinutes = 15, limit = 50) {
  const admin = createAdminClient();
  const provider = getPaymentProvider();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();

  const { data: stuck } = await admin
    .from('payments')
    .select('*')
    .in('status', ['created', 'pending', 'processing'])
    .not('provider_order_id', 'is', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(limit)
    .returns<Payment[]>();

  const summary = { checked: 0, confirmed: 0, failed: 0, untouched: 0, errors: 0 };
  if (!stuck?.length) return summary;

  for (const payment of stuck) {
    summary.checked += 1;
    try {
      // Without a provider payment id there is nothing to fetch. If the order
      // is old enough that no payment was ever attempted, expire it.
      if (!payment.provider_payment_id) {
        await failPayment({
          paymentId: payment.id,
          errorCode: 'abandoned',
          errorDescription: 'No payment was attempted before the order expired.',
        });
        summary.failed += 1;
        continue;
      }

      const remote = await provider.fetchPayment(payment.provider_payment_id);

      if (remote.status === 'captured') {
        const outcome = await settlePayment({
          paymentId: payment.id,
          providerPaymentId: remote.id,
          amountPaise: remote.amountMinor,
          method: remote.method,
          source: 'reconcile',
        });
        if (outcome.status === 'confirmed' || outcome.status === 'duplicate') summary.confirmed += 1;
        else summary.errors += 1;
      } else if (remote.status === 'failed') {
        await failPayment({
          paymentId: payment.id,
          errorCode: remote.errorCode,
          errorDescription: remote.errorDescription,
        });
        summary.failed += 1;
      } else {
        // 'authorized' or 'created': still genuinely in flight. Leave it; the
        // next sweep will pick it up.
        summary.untouched += 1;
      }
    } catch (error) {
      summary.errors += 1;
      console.error('[reconcile] payment failed to reconcile', payment.id, error);
    }
  }

  return summary;
}
