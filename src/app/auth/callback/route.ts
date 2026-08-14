import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * OAuth / magic-link / password-reset callback.
 *
 * Exchanges the code for a session, then applies the SAME server-side role
 * resolution as the password path — one login route, one place that decides
 * where a user lands.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const rawNext = url.searchParams.get('next');

  // Same open-redirect guard as the login action.
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', url.origin));
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  const destination =
    next ?? (profile?.role === 'admin' ? '/admin' : '/dashboard');

  return NextResponse.redirect(new URL(destination, url.origin));
}
