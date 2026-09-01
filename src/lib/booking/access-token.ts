import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env';

/**
 * A capability token for viewing one booking without being logged in.
 *
 * WHY THIS IS NEEDED AT ALL
 *
 * Booking no longer requires an account, so after paying, a client has no
 * session — and /book/confirm used to prove ownership with
 * `.eq('user_id', profile.id)`. Something has to take over that job, because
 * the alternatives are both unacceptable:
 *
 *   · show any booking by id or reference — references are SEQUENTIAL
 *     (KK-100248, KK-100249…), so that is an enumerable list of every client's
 *     name, question and phone number. Not a theoretical risk; incrementing an
 *     integer is the first thing anyone tries.
 *   · force a login to see the confirmation — which reintroduces the exact
 *     friction this change removed, at the worst possible moment: immediately
 *     after taking someone's money.
 *
 * WHY AN HMAC AND NOT A COLUMN
 *
 * A stored random token would work, but it needs a column, an index, a
 * migration and a rotation story. An HMAC over the appointment id is derived,
 * so there is nothing extra to store, nothing to leak from a database dump that
 * is not already in that dump, and no way for a token to exist for an
 * appointment that does not.
 *
 * PROPERTIES THIS DOES AND DOES NOT HAVE
 *
 *   ✓ unguessable — 160 bits of HMAC-SHA256 output
 *   ✓ per-appointment — a token for one booking reveals nothing about another
 *   ✓ constant-time compared, so the check cannot be walked byte by byte
 *   ✗ NOT a session. It grants read access to one booking's confirmation and
 *     nothing else. It cannot cancel, reschedule, pay, or reach the dashboard.
 *   ✗ NOT revocable individually. Rotating BOOKING_LINK_SECRET invalidates
 *     every outstanding link at once, which is the correct blunt instrument for
 *     a read-only capability and is why this must never guard anything that
 *     changes state.
 *
 * The link is sent over WhatsApp and email to the client themselves, so its
 * threat model is "someone else reads this person's message", which is the same
 * exposure the confirmation's contents already have.
 */

/**
 * Dedicated secret, with a deliberate fallback.
 *
 * If BOOKING_LINK_SECRET is unset, this derives a key from the service-role key
 * instead — HKDF-style, through a hash with a fixed label, so the resulting key
 * is one-way and cannot be walked back to the service key even if a token were
 * somehow inverted. That means booking links work on a deployment that has not
 * set the new variable yet, rather than every confirmation page 500ing after a
 * deploy that lands before the env var does.
 */
function signingKey(): Buffer {
  const explicit = process.env.BOOKING_LINK_SECRET;
  if (explicit && explicit.length >= 16) return Buffer.from(explicit, 'utf8');

  return crypto
    .createHash('sha256')
    .update('komalkalra:booking-link:v1')
    .update(env().SUPABASE_SERVICE_ROLE_KEY)
    .digest();
}

export function bookingAccessToken(appointmentId: string): string {
  return crypto
    .createHmac('sha256', signingKey())
    .update(appointmentId)
    .digest('base64url')
    .slice(0, 27); // ~160 bits
}

export function isValidBookingToken(appointmentId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = bookingAccessToken(appointmentId);

  // Length is checked first because timingSafeEqual THROWS on a length
  // mismatch rather than returning false — and an uncaught throw here would
  // itself be a timing signal, as well as a 500 on a malformed URL.
  if (token.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Absolute URL for the confirmation/receipt view of one booking. */
export function bookingLink(appointmentId: string): string {
  const base = env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}/book/confirm?appointment=${appointmentId}&t=${bookingAccessToken(appointmentId)}`;
}
