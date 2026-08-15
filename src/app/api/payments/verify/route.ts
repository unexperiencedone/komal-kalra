import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from '@/lib/payments/razorpay';
import { settlePayment } from '@/lib/payments/settle';
import { getCurrentUser } from '@/lib/auth/session';
import { verifyPaymentSchema } from '@/lib/validation/schemas';
import { ok, fail, fromZodError, fromUnknownError } from '@/lib/api';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';

/**
 * Checkout handler verification — the fast confirmation path.
 *
 * This exists so the user sees "confirmed" immediately rather than waiting on a
 * webhook. It is NOT the authority: the webhook is (docs/research.md §4.2).
 *
 * The three values in the body come from the user's browser and are entirely
 * attacker-controllable. They become trustworthy only when
 * verifyCheckoutSignature() recomputes the HMAC with a secret the browser has
 * never seen. Without that step, `{"razorpay_payment_id": "anything"}` would
 * confirm a free booking.
 *
 * After signature verification we ALSO fetch the payment from Razorpay's API
 * and settle using the amount and status the provider reports — not the ones
 * the browser sent. A valid signature proves the ids are genuine; it does not
 * prove the payment was captured for the right amount.
 */

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`verify:${ip}`, LIMITS.verifyPayment.limit, LIMITS.verifyPayment.windowMs);
    if (!limit.allowed) {
      return fail('rate_limited', 'Too many attempts. Please wait a moment.', 429);
    }

    const user = await getCurrentUser();
    if (!user) return fail('unauthorized', 'Please sign in to continue.', 401);

    const parsed = verifyPaymentSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // ---- Signature: the only thing that makes the ids above meaningful -----
    const provider = getPaymentProvider();
    const valid = provider.verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      console.warn('[verify] signature mismatch', { user: user.id, order: razorpay_order_id });
      return fail(
        'invalid_signature',
        'We could not verify this payment. If money has left your account, it will be returned automatically — please contact us.',
        400,
      );
    }

    const admin = createAdminClient();
    const { data: payment } = await admin
      .from('payments')
      .select('id, user_id, amount_paise, appointment_id, status')
      .eq('provider_order_id', razorpay_order_id)
      .maybeSingle();

    if (!payment) return fail('not_found', 'We could not find that payment.', 404);

    // Ownership. A valid signature proves the payment is real; it does not
    // prove it belongs to the person asking about it.
    if (payment.user_id !== user.id) {
      return fail('forbidden', 'That payment belongs to a different account.', 403);
    }

    // ---- Provider is the authority on amount and status --------------------
    const remote = await provider.fetchPayment(razorpay_payment_id);

    if (remote.status !== 'captured') {
      return fail(
        'not_captured',
        'This payment has not completed yet. If it was debited, it will confirm shortly.',
        409,
      );
    }

    const outcome = await settlePayment({
      paymentId: payment.id,
      providerPaymentId: razorpay_payment_id,
      amountPaise: remote.amountMinor,
      method: remote.method,
      signature: razorpay_signature,
      source: 'verify',
    });

    switch (outcome.status) {
      case 'confirmed':
      case 'duplicate':
        return ok({
          status: 'confirmed',
          appointmentId: outcome.appointmentId ?? payment.appointment_id,
          reference: outcome.reference ?? null,
        });

      case 'conflict':
        return ok({
          status: 'needs_attention',
          appointmentId: outcome.appointmentId,
          message:
            'Your payment succeeded, but that time was taken moments before it completed. We will contact you right away to rearrange, or refund you in full.',
        });

      case 'mismatch':
        return fail('amount_mismatch', 'The payment amount did not match this booking. We are looking into it.', 409);

      default:
        return fail('settle_failed', 'We could not confirm your booking automatically. Please contact us — your payment is safe.', 500);
    }
  } catch (error) {
    return fromUnknownError(error, 'payments/verify');
  }
}
