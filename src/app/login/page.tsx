import type { Metadata } from 'next';
import { LoginExperience } from './LoginExperience';

export const metadata: Metadata = {
  title: 'Sign in',
  // Application surface, not content. Indexing a login page produces a thin
  // result and gives an attacker a discovery path.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginExperience />;
}
