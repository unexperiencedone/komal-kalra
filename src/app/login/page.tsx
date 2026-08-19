import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth/session';
import { LoginExperience } from './LoginExperience';

export const metadata: Metadata = {
  title: 'Sign in',
  // Application surface, not content. Indexing a login page produces a thin
  // result and gives an attacker a discovery path.
  robots: { index: false, follow: false },
};

/**
 * Already signed in? Go where you were going.
 *
 * The site header used to branch its "Login" link on the session, which meant
 * a cookie read in the marketing layout — and that layout wraps the
 * prerendered `/services/[slug]`, so it broke static rendering and 500'd on
 * Vercel. The header now always links here and this page does the branching.
 *
 * Same role routing as `/auth/callback`, deliberately: one place decides where
 * an admin lands versus a client, and that decision is made on the SERVER from
 * the profile row, never from a client-side check.
 */
export default async function LoginPage() {
  const profile = await getProfile();
  if (profile) redirect(profile.role === 'admin' ? '/admin' : '/dashboard');

  return <LoginExperience />;
}
