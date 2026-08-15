'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signInSchema, signUpSchema, resetRequestSchema } from '@/lib/validation/schemas';
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit';

/**
 * Authentication server actions for the single /login route.
 *
 * THE ROLE RULE, which the brief calls out explicitly:
 * `signUp` never sets a role. The database default is 'client' and the
 * handle_new_user() trigger hardcodes 'client'. Even if a caller posted
 * `role: 'admin'` in the form body, there is no code path here that reads it,
 * and protect_profile_role() would reject the write anyway. Promoting an admin
 * is a SQL-editor operation. See database/03_profiles.sql.
 */

export type AuthState = { error?: string; success?: string; fields?: Record<string, string> } | null;

function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === 'string' ? value : '';
  // Only same-origin relative paths. Without this check, `?next=https://evil.com`
  // turns the login page into an open redirect that phishers can use to make a
  // malicious link look like it came from this domain.
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

async function limited(bucket: string) {
  const ip = clientIp(await headers());
  return !rateLimit(`${bucket}:${ip}`, LIMITS.auth.limit, LIMITS.auth.windowMs).allowed;
}

/**
 * Resolves where a signed-in user belongs.
 *
 * This is THE role-based routing the brief describes: one login route, the role
 * read server-side from the database after authentication, then a redirect.
 * A user cannot influence the outcome — the role comes from `profiles`, not
 * from the form, the session, or a query parameter.
 */
async function destinationFor(userId: string, requestedNext: string | null): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();

  if (data?.role === 'admin') {
    // An admin who explicitly asked for a client page still gets it; otherwise
    // they land on the console.
    return requestedNext && requestedNext.startsWith('/admin') ? requestedNext : (requestedNext ?? '/admin');
  }

  // A non-admin who asked for /admin is sent to their own dashboard rather than
  // to a 403 — they are authenticated, just not authorised, and /admin will
  // bounce them anyway.
  if (!requestedNext || requestedNext.startsWith('/admin')) return '/dashboard';
  return requestedNext;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited('signin')) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Please check your email and password.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    // Deliberately generic: distinguishing "no such account" from "wrong
    // password" lets an attacker enumerate which emails are registered.
    return { error: 'That email and password do not match. Please try again.' };
  }

  const next = await destinationFor(data.user.id, safeNext(formData.get('next')));
  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited('signup')) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' };
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join('.')] = issue.message;
    return { error: 'Please check the highlighted fields.', fields };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Metadata only. handle_new_user() reads these to populate the profile;
      // it does NOT read anything role-related, and cannot be made to.
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account already exists with that email. Try signing in instead.' };
    }
    return { error: 'We could not create your account. Please try again.' };
  }

  // Email confirmation is on: no session is returned until the link is clicked.
  if (!data.session) {
    return { success: 'Check your email — we have sent a link to confirm your account.' };
  }

  const next = await destinationFor(data.user!.id, safeNext(formData.get('next')));
  revalidatePath('/', 'layout');
  redirect(next);
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited('reset')) {
    return { error: 'Too many attempts. Please wait a few minutes.' };
  }

  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Please enter a valid email address.' };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard/profile`,
  });

  // Always the same response, whether or not the account exists — otherwise
  // this endpoint becomes an account-enumeration oracle.
  return { success: 'If an account exists for that email, a reset link is on its way.' };
}

/**
 * Google sign-in.
 *
 * WHY SUPABASE AUTH AND NOT NEXTAUTH
 *
 * Every row-level security policy in this database keys on `auth.uid()`, which
 * reads the Supabase JWT. A NextAuth session is not a Supabase JWT, so
 * `auth.uid()` would return null for anyone who signed in with Google — and
 * every "clients see only their own appointments" policy would stop working
 * correctly. Bolting a second auth system alongside Supabase Auth also means
 * two user tables and two session lifecycles to keep in sync.
 *
 * Using Supabase's own Google provider means the Google user lands in
 * `auth.users` exactly like a password user, `handle_new_user()` creates their
 * profile with role 'client', and every existing policy keeps working unchanged.
 *
 * FLOW
 * `signInWithOAuth` does NOT redirect on the server — it returns a URL. We
 * redirect to it ourselves, Google sends the user back to /auth/callback, and
 * that route exchanges the code and applies the same role-based routing as the
 * password path. One login route, one place that decides where a user lands.
 */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Carry the post-login destination through Google and back, using the same
  // same-origin guard as the password path so this cannot become an open
  // redirect.
  const next = safeNext(formData.get('next'));
  const callback = new URL('/auth/callback', origin);
  if (next) callback.searchParams.set('next', next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      queryParams: {
        // Ask for a refresh token and always show the account chooser, so a
        // shared device does not silently sign in as the previous person.
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error || !data.url) {
    redirect('/login?error=google_unavailable');
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
