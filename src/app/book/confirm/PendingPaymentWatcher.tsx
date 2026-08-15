'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Polls until the webhook lands.
 *
 * This exists for the window between "the browser handler could not settle the
 * payment" and "the webhook arrives". Without it, the user sits on an
 * indeterminate screen and often pays twice.
 *
 * Polls every 3 seconds and gives up after 60. Backing off rather than polling
 * forever matters: a payment that has not confirmed in a minute needs a person,
 * not another request.
 */
export function PendingPaymentWatcher({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const interval = setInterval(async () => {
      if (cancelled) return;
      setElapsed((e) => e + 3);

      try {
        const response = await fetch(`/api/bookings/status?appointment=${appointmentId}`, {
          cache: 'no-store',
        });
        const json = await response.json();
        if (json.ok && json.data.status === 'confirmed') {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Network blip. The next tick tries again.
      }
    }, 3000);

    const stop = setTimeout(() => clearInterval(interval), 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [appointmentId, router]);

  if (elapsed >= 60) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className="mt-6 flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-linen)] bg-white px-4 py-3 text-sm text-[var(--color-bark)]"
    >
      <Loader2 className="size-4 animate-spin text-[var(--color-ember-text)]" aria-hidden />
      Checking with your bank…
    </p>
  );
}
