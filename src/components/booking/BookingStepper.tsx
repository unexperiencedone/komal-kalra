import { cn } from '@/lib/utils';

/**
 * Four-step progress rail, taken from the booking design.
 *
 * Circles are the one place a radius survives in this system — a numbered step
 * marker reads as a marker only when it is round. Everything else stays sharp.
 *
 * Completed and current steps fill navy; upcoming ones are a hairline outline.
 * The connecting rules are 1px, matching the "structural lines" language.
 */
export const BOOKING_STEPS = ['Selection', 'Schedule', 'Details', 'Payment'] as const;
export type BookingStepName = (typeof BOOKING_STEPS)[number];

export function BookingStepper({ current }: { current: BookingStepName }) {
  const activeIndex = BOOKING_STEPS.indexOf(current);

  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-3 overflow-x-auto pb-1 sm:gap-4"
    >
      {BOOKING_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step} className="flex flex-1 shrink-0 items-center gap-3">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'label-small flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                done || active
                  ? 'border-[var(--color-cosmic-navy)] bg-[var(--color-cosmic-navy)] text-[var(--color-warm-ivory)]'
                  : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]',
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'label-caps whitespace-nowrap',
                active
                  ? 'text-[var(--color-cosmic-navy)]'
                  : 'text-[var(--color-on-surface-variant)]',
              )}
            >
              {step}
            </span>
            {i < BOOKING_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'hidden h-px flex-1 sm:block',
                  done ? 'bg-[var(--color-cosmic-navy)]' : 'bg-[var(--color-outline-variant)]',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
