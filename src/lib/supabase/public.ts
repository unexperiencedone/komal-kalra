import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for PUBLIC data, with no session cookies attached.
 *
 * WHY THIS EXISTS — it fixes a production-only 500.
 *
 * `/services/[slug]` has `generateStaticParams`, so Next prerenders it and
 * serves it through ISR. Every read on that page went through
 * `createClient()` in `./server.ts`, which calls `cookies()`. Reading cookies
 * is a dynamic API: it cannot be done while prerendering, because there is no
 * request to read them from. Next signals that by throwing
 * `DYNAMIC_SERVER_USAGE`, and on Vercel the ISR regeneration surfaced it as
 * FUNCTION_INVOCATION_FAILED.
 *
 * It never appeared locally because `next dev` renders every request
 * dynamically — there is no prerender pass to conflict with. This is the
 * standard shape of a "works on my machine" Next bug: dev is always dynamic,
 * production is static wherever it can be.
 *
 * SECURITY IS UNCHANGED. This uses the same anon key as the cookie client, so
 * row-level security still applies — the catalogue policy is
 * `active = true and internal = false`, and an anonymous caller gets exactly
 * what an anonymous visitor is allowed to see. Dropping the cookies drops the
 * *session*, not the enforcement. That is precisely right for the marketing
 * pages, which show the same catalogue to everybody.
 *
 * WHEN NOT TO USE THIS
 *
 *   • Anything scoped to the signed-in user → `./server.ts` (needs the session)
 *   • Anything that must bypass RLS       → `./admin.ts` (service role)
 *
 * If a query would return different rows depending on who is asking, this is
 * the wrong client.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // No session to persist, refresh or detect. Without these the client
        // tries to manage a session that does not exist, which is wasted work
        // and, in a prerender, another way to reach for request state.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
