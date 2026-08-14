import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase session cookie on each matched request and returns
 * both the response (carrying updated cookies) and the current user.
 *
 * Deliberately does NOT make authorisation decisions. Next.js documentation is
 * explicit that proxy is for optimistic checks, not authorisation — see
 * docs/research.md §9.7. Real enforcement lives in `requireAdmin()` and is
 * re-run inside every protected page and route handler.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token against the auth server. getSession() only
  // decodes the cookie and must not be trusted for anything that matters.
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user, supabase };
}
