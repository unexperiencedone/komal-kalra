import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from './razorpay';
import { writeAdminLog } from '@/lib/audit';
import { queueNotification } from '@/lib/notifications/outbox';
import type { Payment } from '@/types/database';

/**
 * Refunds. Admin-only, audited, idempotent.
 *
 * Ordering matters here and is deliberate:
 *   1. validate locally (is it refundable, is the amount within bounds)
 *   2. call the provider (the operation that can actually move money)
 *   3. record the result locally
 *
 * Recording before calling would leave the ledger claiming a refund that never
 * happened if step 2 failed. Recording after means a crash between 2 and 3
 * leaves money refunded but unrecorded — which the reconciliation sweep and the
 * `refund.processed` webhook both correct, because record_refund() is
 * idempotent on the provider refund id.
 */

export interface RefundOutcome {
  ok: boolean;
  code?: string;
  message: string;
  refundId?: string;
  refundedPaise?: number;
}

export async function issueRefund(params: {
  paymentId: string;
  amountPaise?: number;
  reason: string;
  adminId: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<RefundOutcome> {
  const admin = createAdminClient();
  const provider = getPaymentProvider();

  const { data: payment } = await admin
    .from('payments')
    .select('*')
    .eq('id', params.paymentId)
    .maybeSingle<Payment>();

  if (!payment) return { ok: false, code: 'not_found', message: 'Payment not found.' };

  if (!['paid', 'partially_refunded'].includes(payment.status)) {
    return {
      ok: false,
      code: 'not_refundable',
      message: `A payment with status "${payment.status}" cannot be refunded.`,
    };
  }
  if (!payment.provider_payment_id) {
    return { ok: false, code: 'no_provider_id', message: 'This payment has no provider reference.' };
  }

  const remaining = payment.amount_paise - payment.amount_refunded_paise;
  const amount = params.amountPaise ?? remaining;

  if (amount <= 0) {
    return { ok: false, code: 'already_refunded', message: 'This payment is already fully refunded.' };
  }
  if (amount > remaining) {
    return {
      ok: false,
      code: 'amount_too_large',
      message: `Only ${remaining / 100} is left to refund on this payment.`,
    };
  }

  // Idempotency key over (payment, amount, remaining balance). A double-clicked
  // button produces the same key and Razorpay rejects the duplicate.
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${payment.id}:${amount}:${payment.amount_refunded_paise}`)
    .digest('hex')
    .slice(0, 40);

  try {
    const refund = await provider.refund({
      paymentId: payment.provider_payment_id,
      // Omitting the amount means "refund everything" to the provider.
      amountMinor: amount === remaining && payment.amount_refunded_paise === 0 ? undefined : amount,
      idempotencyKey,
      notes: { reason: params.reason.slice(0, 240), payment_id: payment.id },
    });

    const { data: recorded } = await admin.rpc('record_refund', {
      p_payment_id: payment.id,
      p_provider_refund_id: refund.id,
      p_amount_paise: refund.amountMinor,
      p_status: refund.status === 'failed' ? 'failed' : 'processed',
      p_reason: params.reason,
      p_initiated_by: params.adminId,
      p_provider_response: refund as unknown as Record<string, unknown>,
    });

    await writeAdminLog({
      adminId: params.adminId,
      action: 'payment.refund',
      entityType: 'payment',
      entityId: payment.id,
      metadata: {
        amount_paise: refund.amountMinor,
        reason: params.reason,
        provider_refund_id: refund.id,
        previous_status: payment.status,
        previous_refunded_paise: payment.amount_refunded_paise,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    await queueNotification({
      template: 'refund_issued',
      paymentId: payment.id,
      dedupeKey: `refund:${refund.id}`,
    });

    return {
      ok: true,
      message: 'Refund initiated. It usually settles in 5–7 working days.',
      refundId: refund.id,
      refundedPaise: (recorded as { refunded_paise?: number } | null)?.refunded_paise ?? refund.amountMinor,
    };
  } catch (error) {
    console.error('[refund] provider call failed', { paymentId: payment.id, error });
    await writeAdminLog({
      adminId: params.adminId,
      action: 'payment.refund_failed',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { amount_paise: amount, reason: params.reason, error: String(error) },
      ip: params.ip,
      userAgent: params.userAgent,
    });
    return {
      ok: false,
      code: 'provider_error',
      message: 'The payment provider rejected the refund. Nothing has been charged or refunded.',
    };
  }
}
