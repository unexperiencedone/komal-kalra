import type { Metadata } from 'next';
import { RefundContent, LAST_UPDATED } from '@/lib/content/legal';

export const metadata: Metadata = {
  title: 'Cancellation & refunds',
  description: 'How cancellation, rescheduling and refunds work for consultations.',
  alternates: { canonical: '/legal/refunds' },
};

export default function RefundsPage() {
  return (
    <article>
      <h1 className="text-[length:var(--text-h1)]">Cancellation &amp; refunds</h1>
      <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Last updated: {LAST_UPDATED}</p>
      <div className="mt-8"><RefundContent /></div>
    </article>
  );
}
