import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client bound to the request's session cookies.
 *
 * Still uses the anon key, so RLS applies. Use this for anything that should be
 * scoped to the signed-in user — it is the safe default. Reach for
 * `createAdminClient()` only when RLS must be bypassed, and only after you have
 * checked authorisation yourself.
 *
 * Next.js 16: `cookies()` is async with no synchronous fallback.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled in proxy.ts instead, so this is safe
            // to swallow — it is the documented Supabase SSR pattern.
          }
        },
      },
    },
  );
}
