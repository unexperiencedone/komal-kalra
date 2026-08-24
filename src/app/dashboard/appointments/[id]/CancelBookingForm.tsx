import { Phone } from 'lucide-react';
import { BRAND, POLICY } from '@/lib/config';

/**
 * Booking management panel.
 *
 * ⚠️  THIS USED TO BE A CANCEL FORM. It is not one any more, and the change is
 * policy rather than styling: bookings are final once paid.
 *
 * The self-service reschedule went with it. A reschedule now happens by phone,
 * because moving a session means agreeing a new time with Komal — a booking
 * that silently jumps to another slot is a diary change she finds out about
 * afterwards.
 *
 * WHY THERE IS NO BUTTON HERE AT ALL
 *
 * Removing the control is presentation, not enforcement. The real guards are
 * in `database/24_final_sale_policy.sql`: the client update policy no longer
 * admits `cancelled`, and `protect_appointment_columns()` refuses any
 * client-initiated status change. Anyone calling PostgREST with their own JWT
 * gets a 42501 rather than a cancelled booking.
 *
 * So this panel's job is only to tell the truth about what is possible and
 * give the reader the one route that works.
 *
 * The file name is unchanged so imports keep resolving; it is exported as
 * `CancelBookingForm` for the same reason. Renaming both is a tidy-up worth
 * doing, but not in the same commit as a policy change.
 */
export function CancelBookingForm() {
  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-5">
      <p className="text-sm leading-relaxed text-[var(--color-body-warm)]">
        {POLICY.cancellationSummary}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-[var(--color-body-warm)]">
        {POLICY.rescheduleSummary}
      </p>

      <a
        href={`tel:${BRAND.phonesE164[0]}`}
        className="label-caps mt-6 inline-flex items-center gap-2 border border-[var(--color-cocoa)] px-5 py-3 text-[var(--color-cocoa)] transition-colors hover:bg-[var(--color-cocoa)] hover:text-[var(--color-cream)]"
      >
        <Phone className="size-4" aria-hidden />
        Call {BRAND.phones[0]}
      </a>

      {/*
        The Komal-side exception, stated where someone worried about their
        money will actually see it. Burying it in the refunds page would make
        the policy read as "we keep your fee whatever happens", which is
        neither what is implemented nor what is enforceable.
      */}
      <p className="mt-6 border-t border-[var(--color-hairline)] pt-4 text-xs leading-relaxed text-[var(--color-body-warm)]">
        If Komal has to cancel, or your session cannot go ahead from our side, you are
        refunded in full or moved to another time — whichever you prefer.
      </p>
    </div>
  );
}
