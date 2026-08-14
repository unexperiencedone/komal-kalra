import 'server-only';

/**
 * Payment provider abstraction.
 *
 * Razorpay is the implementation; this interface exists so adding Stripe later
 * is a new file rather than a rewrite of the booking flow. Every concept here
 * is deliberately provider-neutral:
 *   - amounts are integer minor units (paise / cents)
 *   - "order" is the pre-payment intent
 *   - signature verification is a provider concern, not a caller concern
 *
 * What the interface does NOT abstract is idempotency and state transitions —
 * those live in the database (public.confirm_appointment_payment) because they
 * must hold regardless of which provider produced the event.
 */

export interface CreateOrderArgs {
  amountMinor: number;
  currency: string;
  /** Our own receipt reference, echoed back by the provider. */
  receipt: string;
  notes?: Record<string, string>;
  /** Guards against a double-submitted checkout creating two orders. */
  idempotencyKey: string;
}

export interface ProviderOrder {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
}

export interface ProviderPayment {
  id: string;
  orderId: string | null;
  amountMinor: number;
  amountRefundedMinor: number;
  currency: string;
  /** Provider-native status, e.g. razorpay: created|authorized|captured|refunded|failed */
  status: string;
  method: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  capturedAt: string | null;
}

export interface RefundArgs {
  paymentId: string;
  /** Omit for a full refund — matches Razorpay's own semantics. */
  amountMinor?: number;
  notes?: Record<string, string>;
  idempotencyKey: string;
}

export interface ProviderRefund {
  id: string;
  paymentId: string;
  amountMinor: number;
  status: string;
}

export interface PaymentProviderAdapter {
  readonly name: 'razorpay' | 'stripe';
  /** Publishable key handed to the browser SDK. Never a secret. */
  publicKey(): string;
  createOrder(args: CreateOrderArgs): Promise<ProviderOrder>;
  fetchPayment(paymentId: string): Promise<ProviderPayment>;
  refund(args: RefundArgs): Promise<ProviderRefund>;
  /** HMAC over the checkout handler payload. */
  verifyCheckoutSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
  /** HMAC over the RAW webhook body bytes. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
