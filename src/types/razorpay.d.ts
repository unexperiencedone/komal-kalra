/**
 * Razorpay Checkout (browser SDK) types.
 *
 * The SDK ships no types, and an `any` here would erase the one place where
 * getting a field name wrong silently breaks payments.
 */
export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;          // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean };
  retry?: { enabled: boolean };
}

export interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: { error: { code: string; description: string; reason?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
