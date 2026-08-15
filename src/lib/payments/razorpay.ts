import 'server-only';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '@/lib/env';
import type {
  CreateOrderArgs, PaymentProviderAdapter, ProviderOrder,
  ProviderPayment, ProviderRefund, RefundArgs,
} from './provider';

/**
 * Razorpay's three vars are optional in the shared env() schema (see env.ts),
 * so every actual payment operation re-checks them here and fails loudly with
 * a specific message rather than a generic "undefined is not a string" from
 * deep inside the SDK. Route handlers should still check isPaymentsConfigured()
 * first and return a clean 503 — this is the defence-in-depth backstop.
 */
function requireRazorpayEnv() {
  const e = env();
  if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET || !e.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error(
      'Razorpay is not configured: set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and ' +
        'RAZORPAY_WEBHOOK_SECRET. Use isPaymentsConfigured() to check before reaching here.',
    );
  }
  return e as typeof e & {
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    RAZORPAY_WEBHOOK_SECRET: string;
  };
}

let client: Razorpay | null = null;
function sdk(): Razorpay {
  if (client) return client;
  const e = requireRazorpayEnv();
  client = new Razorpay({ key_id: e.RAZORPAY_KEY_ID, key_secret: e.RAZORPAY_KEY_SECRET });
  return client;
}

/**
 * Constant-time comparison.
 *
 * `===` on a hex digest leaks information through timing: an attacker can learn
 * the expected value one byte at a time. `timingSafeEqual` requires equal
 * lengths, so the length check comes first and is itself not secret.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function hmacHex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export const razorpayAdapter: PaymentProviderAdapter = {
  name: 'razorpay',

  publicKey() {
    return requireRazorpayEnv().RAZORPAY_KEY_ID;
  },

  async createOrder(args: CreateOrderArgs): Promise<ProviderOrder> {
    const order = await sdk().orders.create({
      amount: args.amountMinor,          // PAISE. Razorpay is minor-unit native.
      currency: args.currency,
      receipt: args.receipt,
      notes: args.notes,
      /**
       * AUTO-CAPTURE. Research §4.4: an `authorized` payment is not money in
       * the bank and is auto-refunded if not captured within 3 days, and
       * refunds can only be issued against captured payments. For a scheduled
       * service there is no reason to hold an authorisation, so we capture
       * immediately. This makes `payment.captured` the single event that
       * confirms a booking.
       */
      payment_capture: true,
    });

    return {
      id: order.id,
      amountMinor: Number(order.amount),
      currency: order.currency,
      status: order.status,
    };
  },

  async fetchPayment(paymentId: string): Promise<ProviderPayment> {
    const p = await sdk().payments.fetch(paymentId);
    return {
      id: p.id,
      orderId: (p.order_id as string) ?? null,
      amountMinor: Number(p.amount),
      amountRefundedMinor: Number(p.amount_refunded ?? 0),
      currency: p.currency,
      status: p.status,
      method: (p.method as string) ?? null,
      errorCode: (p.error_code as string) ?? null,
      errorDescription: (p.error_description as string) ?? null,
      capturedAt: p.captured ? new Date(Number(p.created_at) * 1000).toISOString() : null,
    };
  },

  async refund(args: RefundArgs): Promise<ProviderRefund> {
    const r = await sdk().payments.refund(args.paymentId, {
      // Omitting `amount` means a full refund.
      ...(args.amountMinor !== undefined ? { amount: args.amountMinor } : {}),
      speed: 'normal', // 'optimum' costs a fee; not a sensible default for a small business
      notes: args.notes,
      // Provider-side idempotency: a double-clicked refund button cannot issue
      // two refunds, because Razorpay rejects the second with the same key.
      receipt: args.idempotencyKey,
    });

    return {
      id: r.id,
      paymentId: (r.payment_id as string) ?? args.paymentId,
      amountMinor: Number(r.amount),
      status: r.status,
    };
  },

  /**
   * Checkout handler signature.
   *
   * THE most important function in the payment path. The three values it checks
   * come from the user's browser and are fully attacker-controllable. The only
   * thing that makes them trustworthy is recomputing this HMAC with a secret
   * the browser has never seen.
   *
   *   expected = HMAC_SHA256(key_secret, "<order_id>|<payment_id>")
   */
  verifyCheckoutSignature({ orderId, paymentId, signature }): boolean {
    const expected = hmacHex(requireRazorpayEnv().RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    return safeEqual(expected, signature);
  },

  /**
   * Webhook signature — HMAC-SHA256 over the RAW body, keyed with the WEBHOOK
   * secret (a different secret from the API key secret; it is a value you set
   * in the Razorpay dashboard).
   *
   * `rawBody` must be the exact bytes received. The classic integration bug is a
   * JSON parser mutating the body before verification; our route handler calls
   * `await request.text()` first and only parses after this returns true.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = hmacHex(requireRazorpayEnv().RAZORPAY_WEBHOOK_SECRET, rawBody);
    return safeEqual(expected, signature);
  },
};

/** Swap point for adding Stripe later. */
export function getPaymentProvider(): PaymentProviderAdapter {
  return razorpayAdapter;
}
