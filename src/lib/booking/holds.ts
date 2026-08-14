import 'server-only';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { BOOKING } from '@/lib/config';
import type { SlotHold } from '@/types/database';

/**
 * Slot holds — layer 1 of the double-booking defence (docs/research.md §5.3).
 *
 * The actual locking happens in Postgres: create_slot_hold() takes a
 * transaction-scoped advisory lock on the slot instant and re-checks
 * availability inside it, so two simultaneous requests for 4:00 PM serialise
 * and exactly one wins.
 */

const SESSION_COOKIE = 'kk_booking_session';

/**
 * Browser-scoped booking session id.
 *
 * Its purpose is narrow: it lets a visitor's OWN hold remain visible to them
 * (so refreshing the page does not lock them out of the slot they just picked)
 * while blocking everyone else. It is not an auth token and grants nothing.
 *
 * httpOnly so page scripts cannot read or forge it; sameSite lax so it survives
 * the return from Razorpay Checkout.
 */
export async function getOrCreateSessionKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const key = crypto.randomUUID();
  jar.set(SESSION_COOKIE, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6,
  });
  return key;
}

export async function readSessionKey(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function createHold(params: {
  serviceId: string;
  startsAt: string;
  sessionKey: string;
  userId?: string | null;
}): Promise<SlotHold> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .rpc('create_slot_hold', {
      p_service_id: params.serviceId,
      p_starts_at: params.startsAt,
      p_session_key: params.sessionKey,
      p_user_id: params.userId ?? null,
      p_ttl_minutes: BOOKING.holdTtlMinutes,
    })
    .single<SlotHold>();

  // P0001 ("that time is no longer available") is raised by the RPC and is a
  // normal, expected outcome under contention — not an error condition.
  if (error) throw error;
  if (!data) throw new Error('Could not reserve that time');
  return data;
}

export async function releaseHold(holdId: string, sessionKey: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc('release_slot_hold', { p_hold_id: holdId, p_session_key: sessionKey });
}

export async function getHold(holdId: string, sessionKey: string): Promise<SlotHold | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('slot_holds')
    .select('*')
    .eq('id', holdId)
    .eq('session_key', sessionKey)
    .maybeSingle<SlotHold>();
  return data;
}

/** True when the hold can still be converted into a booking. */
export function isHoldLive(hold: SlotHold): boolean {
  return hold.released_at === null && new Date(hold.expires_at).getTime() > Date.now();
}

/** Housekeeping + abandoned-booking capture. Called by the cron sweep. */
export async function expireStaleHolds(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('expire_stale_holds');
  if (error) {
    console.error('[holds] expire_stale_holds failed', error);
    return 0;
  }
  return (data as number) ?? 0;
}
