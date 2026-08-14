import { createBookingOrder } from '@/lib/payments/orders';
import { requireUserForApi } from '@/lib/auth/api-guards';
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
 * Requires authentication — this is the first point in the flow where identity
 * genuinely matters, because a booking must belong to someone.
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

    const auth = await requireUserForApi();
    if (!auth.ok) return auth.response;

    const sessionKey = await readSessionKey();
    if (!sessionKey) {
      return fail('no_session', 'Your reservation has expired. Please choose a time again.', 409);
    }

    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    const result = await createBookingOrder({
      userId: auth.profile.id,
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
