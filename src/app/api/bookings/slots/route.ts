import { getAvailableSlots } from '@/lib/booking/availability';
import { readSessionKey } from '@/lib/booking/holds';
import { ok, fail, fromUnknownError } from '@/lib/api';
import { BOOKING } from '@/lib/config';

/**
 * Available slots for a service over a date window.
 *
 * Public — the calendar must render for anonymous visitors, because forcing
 * signup before someone can see whether you are free is a documented
 * conversion killer (docs/research.md §3).
 *
 * `no-store`: availability is the most time-sensitive data in the product.
 * A cached calendar showing a taken slot converts a visitor into a failed
 * booking, which is worse than a slightly slower response.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');
    if (!serviceId) return fail('missing_service', 'A service is required.', 400);

    const fromParam = url.searchParams.get('from');
    const days = Math.min(Number(url.searchParams.get('days') ?? BOOKING.defaultWindowDays), 60);

    const from = fromParam ? new Date(fromParam) : new Date();
    if (Number.isNaN(from.getTime())) return fail('bad_date', 'Invalid start date.', 400);

    const to = new Date(from);
    to.setDate(to.getDate() + days);

    // The visitor's own hold stays visible to them, so a page refresh does not
    // lock them out of the slot they just picked.
    const sessionKey = await readSessionKey();

    const days_ = await getAvailableSlots({ serviceId, from, to, sessionKey });

    return ok({ days: days_ }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fromUnknownError(error, 'bookings/slots');
  }
}
