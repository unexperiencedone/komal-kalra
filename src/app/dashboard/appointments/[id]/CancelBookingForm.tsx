import { Phone } from 'lucide-react';
import { BRAND, POLICY } from '@/lib/config';

/**
 * Booking policy panel.
 *
 * ⚠️  THIS USED TO BE A CANCEL AND RESCHEDULE FORM. It is deliberately not one
 * any more — bookings are final, and a change of time is arranged by phone.
 *
 * The file keeps its name so the import in page.tsx does not churn, but there
 * is nothing interactive left in it: no client component, no server action, no
 * state. That is the correct shape. A disabled button that says "cancellation
 * unavailable" still invites the attempt and still has to explain itself; a
 * panel that states the position and gives the phone number answers the
 * question the visitor actually has.
 *
 * The rule is NOT enforced here. `protect_appointment_columns()` rejects any
 * client-initiated status change at the database level, so removing this UI is
 * a courtesy to the reader rather than the control — see
 * database/24_booking_policy_final_sale.sql.
 */
export function CancelBookingForm() {
  return (
    <section
      aria-labelledby="booking-policy-heading"
      className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 sm:p-8"
    >
      <h2
        id="booking-policy-heading"
        className="font-[family-name:var(--font-display)] text-xl text-[var(--color-cocoa)]"
      >
        Need to change this booking?
      </h2>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-body-warm)]">
        <p>{POLICY.rescheduleSummary}</p>
        <p>{POLICY.cancellationSummary}</p>
      </div>

      <a
        href={`tel:${BRAND.phonesE164[0]}`}
        className="mt-6 inline-flex items-center gap-2 border border-[var(--color-cocoa)] px-5 py-3 text-sm font-semibold text-[var(--color-cocoa)] transition-colors hover:bg-[var(--color-cocoa)] hover:text-[var(--color-cream)]"
      >
        <Phone className="size-4" aria-hidden />
        {BRAND.phones[0]}
      </a>

      <p className="mt-4 text-xs leading-relaxed text-[var(--color-body-warm)] opacity-80">
        If Komal has to cancel, or a session cannot go ahead from our side, you are refunded in
        full — see the{' '}
        <a href="/legal/refunds" className="underline underline-offset-2">
          cancellation and refunds policy
        </a>
        .
      </p>
    </section>
  );
}
