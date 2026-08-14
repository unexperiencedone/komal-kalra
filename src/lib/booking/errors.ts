/**
 * Translates database and provider errors into messages a person can act on.
 *
 * The important cases are the ones the concurrency design produces on purpose:
 * a lost race for a slot is a normal outcome under load, not a 500, and the
 * user needs to be told to pick another time rather than shown a stack trace.
 */

export interface FriendlyError { code: string; message: string; status: number }

export function toFriendlyBookingError(error: unknown): FriendlyError {
  const e = error as { code?: string; message?: string };

  switch (e?.code) {
    // Raised by create_slot_hold / create_pending_appointment. The message is
    // written for humans in the SQL, so it passes through unchanged.
    case 'P0001':
      return { code: 'slot_unavailable', message: e.message ?? 'That time is no longer available.', status: 409 };

    case 'P0002':
      return { code: 'not_found', message: 'That service is not available for booking.', status: 404 };

    // exclusion_violation — the EXCLUDE constraint fired. Someone booked the
    // slot in the microseconds between our check and our insert.
    case '23P01':
      return { code: 'slot_taken', message: 'That time was just booked by someone else. Please choose another slot.', status: 409 };

    case '23505':
      return { code: 'duplicate', message: 'This booking has already been created.', status: 409 };

    case '42501':
      return { code: 'forbidden', message: 'You do not have permission to do that.', status: 403 };

    default:
      console.error('[booking] unmapped error', error);
      return { code: 'internal_error', message: 'Something went wrong. Please try again, or call us and we will book it for you.', status: 500 };
  }
}
