import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database';

/**
 * THE authorisation module. Every protected surface goes through here.
 *
 * Design notes:
 *  - `getUser()` (not `getSession()`): getSession only decodes a cookie the
 *    client sent and is therefore forgeable. getUser revalidates with the auth
 *    server.
 *  - `role` is read from the database on every request rather than from a JWT
 *    claim. A JWT claim is stale until the token refreshes, meaning a demoted
 *    admin keeps refund powers for up to an hour. For a role that can move
 *    money, immediate revocation is worth an indexed lookup. See research §6.2.
 *  - `cache()` dedupes that lookup within a single render pass, so a page with
 *    six server components does one query, not six.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * OAuth profile photo (currently only Google sets one). Read live from the
 * auth session rather than stored on `profiles` — it's cosmetic, avoids a
 * migration, and Supabase already refreshes it on every Google sign-in, so a
 * changed Google avatar shows up here without any sync logic of our own.
 * Email/password accounts have no such metadata and get null, which callers
 * fall back from to the existing initials avatar.
 */
export const getAvatarUrl = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  return (meta?.avatar_url as string | undefined) ?? (meta?.picture as string | undefined) ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  if (data) return data;

  // Extremely rare: the auth row exists but handle_new_user() has not landed
  // yet (first request immediately after signup). Backfill with the service
  // role rather than showing the user an error.
  const admin = createAdminClient();
  const { data: created } = await admin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) ?? null,
        phone: (user.user_metadata?.phone as string) ?? user.phone ?? null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single<Profile>();

  return created ?? null;
});

/** Signed-in or redirected to /login. Returns a guaranteed profile. */
export async function requireUser(nextPath?: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login');
  }
  return profile;
}

/**
 * Admin or bounced. This is the real admin boundary — proxy.ts is not.
 * Non-admins are sent to /dashboard rather than /login: they ARE authenticated,
 * just not authorised, and a login prompt would be misleading.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login?next=/admin');
  if (profile.role !== 'admin') redirect('/dashboard');
  return profile;
}

/** Non-redirecting variant for route handlers, which must return JSON. */
export async function getAdminOrNull(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile?.role === 'admin' ? profile : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getProfile())?.role === 'admin';
}
