import { createAdminClient } from '@/lib/supabase/admin';
import { requireUserForApi } from '@/lib/auth/api-guards';
import { ok, fail, fromUnknownError } from '@/lib/api';

/**
 * Booking status poll, used by the pending-payment screen.
 *
 * Ownership is enforced with an explicit user_id filter as well as the guard —
 * this endpoint is polled from a page where the user is anxious about money,
 * and it must not be possible to watch someone else's booking by changing an id.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) return auth.response;

    const id = new URL(request.url).searchParams.get('appointment');
    if (!id) return fail('missing_id', 'An appointment id is required.', 400);

    const admin = createAdminClient();
    const { data } = await admin
      .from('appointments')
      .select('id, status, payment_status, reference')
      .eq('id', id)
      .eq('user_id', auth.profile.id)
      .maybeSingle();

    if (!data) return fail('not_found', 'Booking not found.', 404);
    return ok(data);
  } catch (error) {
    return fromUnknownError(error, 'bookings/status');
  }
}
