import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * Rules for using this:
 *   1. Never import it into a Client Component. `server-only` makes that a
 *      build error, which is the point.
 *   2. Every call site must have already established authorisation itself —
 *      RLS is not going to do it for you here.
 *   3. Prefer `createClient()` from ./server.ts. Reach for this only for:
 *        - webhook processing (no user session exists)
 *        - the privileged booking/payment RPCs, which are REVOKEd from
 *          anon/authenticated precisely so they cannot be called any other way
 *        - admin reads that legitimately span all users
 *
 * Cached per process. Auth persistence is disabled because there is no user
 * session attached to this client and persisting one would be a bug.
 */
let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const e = env();
  cached = createSupabaseClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'X-Client-Info': 'komal-kalra-server' } },
  });
  return cached;
}
