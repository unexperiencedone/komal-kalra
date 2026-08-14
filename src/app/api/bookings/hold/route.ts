import { createHold, getOrCreateSessionKey, releaseHold, readSessionKey } from '@/lib/booking/holds';
import { getCurrentUser } from '@/lib/auth/session';
import { createHoldSchema } from '@/lib/validation/schemas';
import { toFriendlyBookingError } from '@/lib/booking/errors';
import { ok, fail, fromZodError, fromUnknownError } from '@/lib/api';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';
import { BOOKING } from '@/lib/config';

/**
 * Reserve a slot for the duration of checkout.
 *
 * Anonymous visitors may hold a slot: requiring signup before slot selection
 * loses buyers, and the hold is short-lived and rate-limited, so the abuse
 * surface is small. The hold grants nothing beyond "this time is pencilled in".
 *
 * The actual race protection is in Postgres — create_slot_hold() takes an
 * advisory lock and re-checks availability inside it (docs/research.md §5.3).
 */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`hold:${ip}`, LIMITS.createHold.limit, LIMITS.createHold.windowMs);
    if (!limit.allowed) {
      return fail('rate_limited', 'Too many attempts. Please wait a moment before trying again.', 429);
    }

    const parsed = createHoldSchema.safeParse(await request.json());
    if (!parsed.success) return fromZodError(parsed.error);

    const sessionKey = await getOrCreateSessionKey();
    const user = await getCurrentUser();

    const hold = await createHold({
      serviceId: parsed.data.serviceId,
      startsAt: parsed.data.startsAt,
      sessionKey,
      userId: user?.id ?? null,
    });

    return ok({
      holdId: hold.id,
      startsAt: hold.starts_at,
      endsAt: hold.ends_at,
      expiresAt: hold.expires_at,
      ttlMinutes: BOOKING.holdTtlMinutes,
    });
  } catch (error) {
    // A lost race is a normal outcome under contention, not a server fault.
    const friendly = toFriendlyBookingError(error);
    if (friendly.status >= 500) return fromUnknownError(error, 'bookings/hold');
    return fail(friendly.code, friendly.message, friendly.status);
  }
}

/** Releasing early frees the slot for everyone else immediately. */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const holdId = url.searchParams.get('holdId');
    const sessionKey = await readSessionKey();

    if (!holdId || !sessionKey) return ok({ released: false });

    await releaseHold(holdId, sessionKey);
    return ok({ released: true });
  } catch (error) {
    return fromUnknownError(error, 'bookings/hold:delete');
  }
}
