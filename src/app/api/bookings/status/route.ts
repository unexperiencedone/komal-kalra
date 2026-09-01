import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/auth/session';
import { isValidBookingToken } from '@/lib/booking/access-token';
import { ok, fail, fromUnknownError } from '@/lib/api';

/**
 * Booking status poll, used by the pending-payment screen.
 *
 * It must not be possible to watch someone else's booking by changing an id —
 * references and ids are handed out in sequence, so an unguarded version of
 * this is a way to watch the practice's whole order book in real time.
 *
 * Two proofs are accepted, exactly as on /book/confirm itself: a signed
 * capability token, or a session that owns the row. Guests now reach this page
 * (booking creates no session), so requiring the latter alone would leave the
 * one screen where someone is anxious about their money unable to refresh
 * itself.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('appointment');
    if (!id) return fail('missing_id', 'An appointment id is required.', 400);

    const hasToken = isValidBookingToken(id, url.searchParams.get('t'));
    const profile = hasToken ? null : await getProfile();

    if (!hasToken && !profile) {
      return fail('unauthorized', 'Please sign in to continue.', 401);
    }

    const admin = createAdminClient();
    let query = admin
      .from('appointments')
      .select('id, status, payment_status, reference')
      .eq('id', id);

    if (!hasToken && profile) query = query.eq('user_id', profile.id);

    const { data } = await query.maybeSingle();

    if (!data) return fail('not_found', 'Booking not found.', 404);
    return ok(data);
  } catch (error) {
    return fromUnknownError(error, 'bookings/status');
  }
}
