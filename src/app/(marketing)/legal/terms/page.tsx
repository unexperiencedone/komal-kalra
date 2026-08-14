import type { Metadata } from 'next';
import { TermsContent, LAST_UPDATED } from '@/lib/content/legal';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms that apply to consultations booked with Astrologer Komal Kalra.',
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-[length:var(--text-h1)]">Terms of service</h1>
      <p className="mt-2 text-sm text-[var(--color-stone)]">Last updated: {LAST_UPDATED}</p>
      <div className="mt-8"><TermsContent /></div>
    </article>
  );
}
