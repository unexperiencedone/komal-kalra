import { createBookingOrder } from '@/lib/payments/orders';
import { resolveBookingIdentity } from '@/lib/auth/booking-identity';
import { readSessionKey } from '@/lib/booking/holds';
import { createOrderSchema } from '@/lib/validation/schemas';
import { toFriendlyBookingError } from '@/lib/booking/errors';
import { ok, fail, fromZodError, fromUnknownError } from '@/lib/api';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';
import { isPaymentsConfigured } from '@/lib/env';

/**
 * Creates the appointment and the provider order, and returns everything the
 * browser needs to open Checkout.
 *
 * What it deliberately does NOT accept: an amount. The client sends a service
 * id, a hold id, and contact details. Price, discount and tax are all computed
 * server-side from the database. There is no request that can produce a ₹1
 * order for a ₹2,600 consultation (docs/architecture.md, "Money").
 *
 * NO LONGER REQUIRES A LOGIN.
 *
 * A booking still must belong to someone — `appointments.user_id` is not null,
 * and an ownerless paid consultation is a support ticket waiting to happen. But
 * the owner is now resolved from the contact details already on the form rather
 * than by bouncing the visitor to /login at the payment step, after they have
 * chosen a time, filled in birth details and had a slot held for them. See
 * src/lib/auth/booking-identity.ts for what that does and, more importantly,
 * what it deliberately does not do (it issues no session).
 *
 * WHAT STILL GUARDS THIS ENDPOINT, now that a session does not:
 *
 *   · the SLOT HOLD. `sessionKey` is an httpOnly cookie and the hold must be
 *     live, unreleased and belong to that same key. You cannot create an
 *     appointment without first having reserved the time through /hold.
 *   · the RATE LIMIT below, which is now the primary abuse control rather than
 *     a secondary one.
 *   · the AMOUNT, which is computed server-side from the database and has never
 *     been accepted from the client.
 *
 * An unauthenticated caller can therefore cause an unpaid `pending_payment` row
 * to exist for a slot they were already holding. That row expires on the
 * reconciliation sweep exactly as an abandoned checkout always has.
 */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isPaymentsConfigured()) {
      return fail(
        'payments_unconfigured',
        'Online payment is not available right now. Please call us and we will book it for you.',
        503,
      );
    }

    const ip = clientIp(request.headers);
    const limit = rateLimit(`order:${ip}`, LIMITS.createOrder.limit, LIMITS.createOrder.windowMs);
    if (!limit.allowed) {
      return fail('rate_limited', 'Too many attempts. Please wait a moment.', 429);
    }

    const sessionKey = await readSessionKey();
    if (!sessionKey) {
      return fail('no_session', 'Your reservation has expired. Please choose a time again.', 409);
    }

    // Parsed BEFORE identity is resolved, so a malformed request cannot create
    // a stray auth user as a side effect of failing validation.
    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    const { profile } = await resolveBookingIdentity({
      fullName: parsed.data.details.fullName,
      email: parsed.data.details.email,
      phone: parsed.data.details.phone,
    });

    const result = await createBookingOrder({
      userId: profile.id,
      serviceId: parsed.data.serviceId,
      holdId: parsed.data.holdId,
      sessionKey,
      details: parsed.data.details,
    });

    return ok({
      orderId: result.providerOrderId,
      // Publishable key. Safe in the browser by design — it identifies the
      // merchant and cannot authorise anything on its own.
      keyId: result.publicKey,
      amountPaise: result.amountPaise,
      currency: result.currency,
      appointmentId: result.appointment.id,
      reference: result.appointment.reference,
      paymentId: result.payment.id,
      prefill: {
        name: parsed.data.details.fullName,
        email: parsed.data.details.email,
        contact: parsed.data.details.phone,
      },
    });
  } catch (error) {
    const friendly = toFriendlyBookingError(error);
    if (friendly.status >= 500) return fromUnknownError(error, 'payments/order');
    return fail(friendly.code, friendly.message, friendly.status);
  }
}
