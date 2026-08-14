import 'server-only';
import { getProfile } from './session';
import { fail } from '@/lib/api';
import type { Profile } from '@/types/database';

/**
 * Route-handler authorisation.
 *
 * Route handlers must return JSON, not redirect, so these are the non-throwing
 * counterparts to requireUser()/requireAdmin() in session.ts.
 *
 * Both re-read the role from the database on every call. `proxy.ts` redirecting
 * a non-admin away from /admin is a UX affordance; THIS is the boundary that
 * actually stops a crafted fetch to /api/admin/refund.
 */

type Guard =
  | { ok: true; profile: Profile }
  | { ok: false; response: ReturnType<typeof fail> };

export async function requireUserForApi(): Promise<Guard> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, response: fail('unauthorized', 'Please sign in to continue.', 401) };
  }
  return { ok: true, profile };
}

export async function requireAdminForApi(): Promise<Guard> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, response: fail('unauthorized', 'Please sign in to continue.', 401) };
  }
  if (profile.role !== 'admin') {
    // 403, not 404: the caller is authenticated and we know who they are.
    // Logged, because an authenticated non-admin hitting an admin endpoint is
    // worth knowing about.
    console.warn('[auth] non-admin attempted an admin endpoint', profile.id);
    return { ok: false, response: fail('forbidden', 'You do not have permission to do that.', 403) };
  }
  return { ok: true, profile };
}
