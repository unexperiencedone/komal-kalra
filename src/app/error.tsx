'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/config';

/**
 * Root error boundary.
 *
 * Shows the digest rather than the raw error message: Next.js redacts server
 * error text in production for good reason, and the digest is what lets us
 * correlate a user's report with a server log entry.
 *
 * A phone number is offered on every error screen. If someone hits an error
 * mid-booking, the worst outcome is that they give up — a working alternative
 * route to the same goal costs nothing and saves the sale.
 */
export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <h1 className="text-[length:var(--text-h1)]">Something went wrong</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-bark)]">
        This is our problem, not yours. Trying again usually fixes it.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-[var(--color-stone)]">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/">Back to the homepage</Link></Button>
      </div>
      <p className="mt-8 text-sm text-[var(--color-stone)]">
        In the middle of booking? Call{' '}
        <a href={`tel:${BRAND.phonesE164[0]}`} className="font-medium text-[var(--color-ember-text)] hover:underline">
          {BRAND.phones[0]}
        </a>{' '}
        and we will do it for you.
      </p>
    </div>
  );
}
