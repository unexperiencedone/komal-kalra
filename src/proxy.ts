import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Next.js 16 renamed `middleware` to `proxy`. The edge runtime is not available
 * here; this runs on Node, which suits the Supabase SSR client fine.
 *
 * Responsibilities, in order of importance:
 *   1. Refresh the Supabase session cookie so server components see a live session.
 *   2. Send signed-out visitors on protected routes to /login with a return path.
 *
 * What this file explicitly does NOT do is authorise admins. A proxy redirect is
 * a UX affordance that a user can never see the effects of bypassing — but it is
 * not a security boundary. `/admin` pages and `/api/admin/*` handlers each
 * re-read the caller's role from the database. See docs/architecture.md.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/admin'];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in and visiting /login: bounce to the right home. Role is
  // resolved server-side on /dashboard, which redirects admins onward.
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets AND the two provider webhooks.
     *
     * Excluding them is deliberate: neither Razorpay nor Meta sends a session
     * cookie, so refreshing one is pure latency on the two most
     * correctness-critical endpoints in the system. It also keeps the raw
     * request body untouched, which both HMAC checks depend on.
     *
     * /api/whatsapp/webhook additionally serves Meta's GET verification
     * handshake, which must return the challenge as plain text — anything that
     * wraps or redirects the response makes "Verify and save" fail.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/payments/webhook|api/whatsapp/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
