import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/auth/session';
import type { Profile } from '@/types/database';

/**
 * Who a booking belongs to, WITHOUT making anyone log in.
 *
 * THE PROBLEM THIS SOLVES
 *
 * `appointments.user_id` is `not null references profiles(id)`, and that is
 * correct — a paid consultation with no owner is a support ticket waiting to
 * happen. But the previous flow satisfied it by bouncing the visitor to /login
 * at the payment step, after they had already picked a time, filled in birth
 * details and had a slot held for them. That is the single worst place in the
 * funnel to interrupt someone, and it is what the practice reported as "login
 * is a hassle".
 *
 * The fix is not to remove the owner. It is to stop making the visitor create
 * one by hand. The booking form already collects name, email and phone; that is
 * enough to identify a person. So we resolve or create the profile SERVER-SIDE
 * and the visitor never sees an account being made.
 *
 * WHAT IS DELIBERATELY NOT DONE HERE
 *
 * No session is issued. This function creates an owner for a row; it does not
 * log anybody in, and nothing it does grants the caller access to anything.
 * That distinction is what makes it safe to run on an unauthenticated request:
 * the worst an attacker achieves by POSTing someone else's email is causing a
 * dormant, password-less, unconfirmed auth row to exist — and then paying for a
 * consultation for them.
 *
 * `email_confirm` is left FALSE for the same reason. We have not verified this
 * address; marking it confirmed would let anyone mint a pre-verified account
 * for an email they do not control, which is a real account-takeover primitive
 * in any system that later trusts `email_confirmed_at`. An unconfirmed row
 * costs us nothing, because we never sign these users in.
 *
 * IDENTITY IS THE EMAIL, deliberately, not the phone. Supabase lower-cases and
 * uniquely indexes emails, so "the same person" has one stable answer. Phone
 * numbers do not: +919812345678, 9812345678 and 098123 45678 are the same
 * person typed three ways, and treating them as distinct would scatter one
 * client's history across three profiles — while normalising them aggressively
 * enough to match risks merging two different people, which is worse.
 */

export interface BookingContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface BookingIdentity {
  profile: Profile;
  /** True when this booking brought a brand-new person into the system. */
  isNew: boolean;
}

/** Supabase stores auth emails lower-cased; match that so lookups hit. */
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function resolveBookingIdentity(
  contact: BookingContact,
): Promise<BookingIdentity> {
  const admin = createAdminClient();
  const email = normaliseEmail(contact.email);

  // ---------------------------------------------------------------- signed in
  // Someone who IS logged in keeps their own account, whatever they typed in
  // the form. Letting a form field redirect a booking onto a different profile
  // would be an account-mixing bug, and a trivial way to attach a booking to
  // somebody else's history.
  const current = await getProfile();
  if (current) {
    await backfill(current, contact);
    return { profile: current, isNew: false };
  }

  // ------------------------------------------------------------ existing user
  const found = await findByEmail(email);
  if (found) {
    await backfill(found, contact);
    return { profile: found, isNew: false };
  }

  // --------------------------------------------------------------- new person
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: {
      full_name: contact.fullName.trim(),
      phone: contact.phone.trim(),
    },
  });

  if (error || !created?.user) {
    // Two bookings for the same new email, milliseconds apart, both miss the
    // lookup above and both try to create. Supabase's unique index on email
    // makes the loser fail here — which is the correct outcome, not an error to
    // report. Re-read and use the row the winner created.
    //
    // This is the same check-then-act race the booking system guards against
    // elsewhere; the database is again the thing that settles it.
    const retry = await findByEmail(email);
    if (retry) {
      await backfill(retry, contact);
      return { profile: retry, isNew: false };
    }

    console.error('[booking-identity] could not create user', error?.message);
    throw Object.assign(
      new Error('We could not start your booking. Please try again, or call us.'),
      { code: 'identity_failed' },
    );
  }

  // handle_new_user() (03_profiles.sql) creates the profile row from the auth
  // trigger. Read it back rather than assuming: if the trigger is missing on a
  // half-migrated database we want a clear failure here, not a foreign-key
  // violation three statements later inside the booking function.
  const profile = await findById(created.user.id);
  if (!profile) {
    console.error('[booking-identity] profile missing after createUser');
    throw Object.assign(
      new Error('We could not start your booking. Please try again, or call us.'),
      { code: 'identity_failed' },
    );
  }

  return { profile, isNew: true };
}

async function findByEmail(email: string): Promise<Profile | null> {
  const admin = createAdminClient();
  // `.eq`, never `.ilike`. An underscore is a legal email character AND a
  // single-character wildcard in LIKE patterns, so `ilike` on a_b@x.com would
  // also match aXb@x.com — attaching a booking to the wrong person's account.
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle<Profile>();
  return data ?? null;
}

async function findById(id: string): Promise<Profile | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Profile>();
  return data ?? null;
}

/**
 * Fill in what the profile is missing — and only what it is missing.
 *
 * Never overwrites a value that is already there. A returning client's saved
 * name must not be replaced because they abbreviated it while typing on a
 * phone, and their profile number must not be replaced because they booked
 * once from a work phone. The details for THIS booking are stored on the
 * appointment itself (see database/29_booking_contact.sql), which is what the
 * WhatsApp confirmation actually reads.
 */
async function backfill(profile: Profile, contact: BookingContact): Promise<void> {
  const patch: Record<string, string> = {};
  if (!profile.full_name && contact.fullName.trim()) patch.full_name = contact.fullName.trim();
  if (!profile.phone && contact.phone.trim()) patch.phone = contact.phone.trim();
  if (Object.keys(patch).length === 0) return;

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(patch).eq('id', profile.id);
  // Non-fatal. A booking must not fail because we could not save a nice-to-have
  // display name.
  if (error) console.error('[booking-identity] backfill failed', error.message);
}
