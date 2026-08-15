import type { Metadata } from 'next';
import { PrivacyContent, LAST_UPDATED } from '@/lib/content/legal';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What personal information we collect, why, and how it is protected.',
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-[length:var(--text-h1)]">Privacy policy</h1>
      <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Last updated: {LAST_UPDATED}</p>
      <div className="mt-8"><PrivacyContent /></div>
    </article>
  );
}
