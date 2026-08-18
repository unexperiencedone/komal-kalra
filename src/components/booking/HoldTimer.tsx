'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { BOOKING } from '@/lib/config';
import { cn } from '@/lib/utils';

/**
 * Countdown for the slot reservation.
 *
 * Shown because an invisible timer is a hostile surprise: a user who returns
 * from a phone call to find their slot gone with no warning blames the site.
 * The bar turns amber in the final two minutes, which is enough to prompt
 * without creating artificial urgency.
 *
 * `aria-live="polite"` announces the state change once rather than reading out
 * every second, which would be unusable with a screen reader.
 */
export function HoldTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= BOOKING.holdWarningSeconds;

  return (
    <div
      className={cn(
        'flex items-center gap-2  border px-3.5 py-2 text-sm',
        urgent
          ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning-container)] text-[var(--color-warning)]'
          : 'border-[var(--color-outline-variant)] bg-white text-[var(--color-body-warm)]',
      )}
    >
      <Timer className="size-4 shrink-0" aria-hidden />
      <span aria-live="polite" aria-atomic="true">
        {remaining > 0 ? (
          <>
            This time is held for you for{' '}
            <strong className="tabular font-semibold">
              {minutes}:{String(seconds).padStart(2, '0')}
            </strong>
          </>
        ) : (
          'Your reservation has expired. Please choose a time again.'
        )}
      </span>
    </div>
  );
}
