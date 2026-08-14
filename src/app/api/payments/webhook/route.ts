import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from '@/lib/payments/razorpay';
import { settlePayment, failPayment } from '@/lib/payments/settle';
import { queueNotification } from '@/lib/notifications/outbox';

/**
 * Razorpay webhook — the source of truth for money.
 *
 * Four rules govern everything in this file, all from docs/research.md §4.3:
 *
 *  1. VERIFY THE RAW BODY FIRST. `request.text()` is read before anything else
 *     and JSON.parse is not called until the HMAC passes. The classic
 *     integration bug is a body parser mutating bytes before verification.
 *
 *  2. IDEMPOTENCY IS A DATABASE CONSTRAINT, NOT A CODE CHECK. Every event is
 *     inserted into payment_events with UNIQUE (provider, event_id). A duplicate
 *     delivery hits that constraint and returns 200 without re-processing.
 *
 *  3. ALWAYS RETURN 2xx ONCE THE EVENT IS DURABLY RECORDED. Razorpay retries on
 *     any non-2xx. Returning 500 because an email failed causes redelivery
 *     forever, so side effects are queued, never awaited for their success.
 *
 *  4. NEVER ASSUME EVENT ORDER. `payment.failed` can arrive after
 *     `payment.captured` on a retried card. The state machine in Postgres
 *     rejects illegal transitions rather than trusting sequence.
 *
 * `proxy.ts` explicitly excludes this path from its matcher: Razorpay sends no
 * session cookie, so session refresh here is pure latency on the most
 * correctness-critical endpoint in the system.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  amount_refunded?: number;
  status?: string;
  method?: string;
  error_code?: string;
  error_description?: string;
  payment_id?: string;
  notes?: Record<string, string>;
};

interface RazorpayWebhook {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    refund?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
}

export async function POST(request: Request) {
  // ---- 1. Raw body, before any parsing --------------------------------------
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  const provider = getPaymentProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    // 401, not 400: this was not a malformed request, it was an unauthenticated
    // one. Nothing is recorded, because unverified bytes are not evidence.
    console.warn('[webhook] signature verification failed');
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Razorpay sends x-razorpay-event-id. If it is ever absent, fall back to a
  // hash of the verified body so the dedupe key is never null.
  const eventId =
    request.headers.get('x-razorpay-event-id') ??
    crypto.createHash('sha256').update(rawBody).digest('hex');

  const paymentEntity = body.payload?.payment?.entity;
  const refundEntity = body.payload?.refund?.entity;
  const orderId = paymentEntity?.order_id ?? body.payload?.order?.entity?.id ?? null;
  const providerPaymentId = paymentEntity?.id ?? refundEntity?.payment_id ?? null;

  // ---- 2. Durable, deduplicated record --------------------------------------
  const { data: eventRow, error: insertError } = await admin
    .from('payment_events')
    .insert({
      provider: 'razorpay',
      event_id: eventId,
      event_type: body.event,
      provider_payment_id: providerPaymentId,
      provider_order_id: orderId,
      payload: body as unknown as Record<string, unknown>,
      signature,
    })
    .select('id')
    .single();

  if (insertError) {
    // 23505 = unique violation on (provider, event_id): this is a retry of an
    // event we have already handled. The correct response is 200, quickly.
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('[webhook] could not record event', insertError);
    // Genuine persistence failure: ask Razorpay to retry, because we have not
    // durably recorded the event and must not silently drop it.
    return NextResponse.json({ ok: false, error: 'persist_failed' }, { status: 500 });
  }

  // ---- 3. Process. Failures here are logged, not surfaced as non-2xx --------
  let processingError: string | null = null;

  try {
    // Resolve our payment row from provider ids. Order id is the reliable link:
    // it exists from the moment we create the order, before any payment id does.
    let paymentRowId: string | null = null;

    if (orderId) {
      const { data } = await admin
        .from('payments')
        .select('id')
        .eq('provider_order_id', orderId)
        .maybeSingle();
      paymentRowId = data?.id ?? null;
    }
    if (!paymentRowId && providerPaymentId) {
      const { data } = await admin
        .from('payments')
        .select('id')
        .eq('provider_payment_id', providerPaymentId)
        .maybeSingle();
      paymentRowId = data?.id ?? null;
    }

    if (!paymentRowId) {
      // An event for something we have no record of. Recorded above for audit,
      // then acknowledged — retrying will not make the record appear.
      processingError = 'no matching payment row';
    } else {
      switch (body.event) {
        case 'payment.captured': {
          const outcome = await settlePayment({
            paymentId: paymentRowId,
            providerPaymentId: paymentEntity!.id!,
            amountPaise: Number(paymentEntity!.amount ?? 0),
            method: paymentEntity!.method ?? null,
            source: 'webhook',
          });
          if (outcome.status === 'error' || outcome.status === 'mismatch') {
            processingError = outcome.message ?? outcome.status;
          }
          break;
        }

        case 'payment.authorized':
          // Recorded for the audit trail only. With payment_capture enabled
          // (research §4.4) authorisation is not what confirms a booking —
          // capture is. Moving to `processing` reflects "in flight".
          await admin
            .from('payments')
            .update({ status: 'processing', provider_payment_id: paymentEntity?.id ?? null })
            .eq('id', paymentRowId)
            .in('status', ['created', 'pending']);
          break;

        case 'payment.failed': {
          const result = await failPayment({
            paymentId: paymentRowId,
            errorCode: paymentEntity?.error_code ?? null,
            errorDescription: paymentEntity?.error_description ?? null,
          });
          // fail_appointment_payment() refuses to un-confirm an already-paid
          // booking, so an out-of-order failure event is harmless.
          if (result?.result === 'failed') {
            await queueNotification({
              template: 'payment_failed',
              paymentId: paymentRowId,
              dedupeKey: `payment_failed:${paymentRowId}`,
            });
          }
          break;
        }

        case 'refund.created':
        case 'refund.processed': {
          // Also covers refunds initiated from the Razorpay dashboard rather
          // than from our admin panel — record_refund() recomputes from the
          // ledger, so either origin converges to the same state.
          await admin.rpc('record_refund', {
            p_payment_id: paymentRowId,
            p_provider_refund_id: refundEntity?.id ?? null,
            p_amount_paise: Number(refundEntity?.amount ?? 0),
            p_status: body.event === 'refund.processed' ? 'processed' : 'pending',
            p_reason: 'Refund reported by payment provider',
            p_initiated_by: null,
            p_provider_response: (refundEntity ?? {}) as Record<string, unknown>,
          });
          break;
        }

        case 'refund.failed':
          await admin
            .from('refunds')
            .update({ status: 'failed' })
            .eq('provider_refund_id', refundEntity?.id ?? '');
          break;

        default:
          // Unhandled event type. Stored, acknowledged, no action.
          break;
      }
    }
  } catch (error) {
    processingError = error instanceof Error ? error.message : String(error);
    console.error('[webhook] processing failed', body.event, error);
  }

  await admin
    .from('payment_events')
    .update({
      processed: processingError === null,
      processed_at: new Date().toISOString(),
      processing_error: processingError,
      attempts: 1,
    })
    .eq('id', eventRow.id);

  // 200 regardless of processing outcome: the event is durably recorded and the
  // reconciliation sweep will repair anything that failed. Making Razorpay
  // redeliver would not fix a bug in our own handler.
  return NextResponse.json({ ok: true });
}
