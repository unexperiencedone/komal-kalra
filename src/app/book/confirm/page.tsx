import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarPlus, CheckCircle2, Clock, Download, Phone, TriangleAlert } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/auth/session';
import { isValidBookingToken } from '@/lib/booking/access-token';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import { PendingPaymentWatcher } from './PendingPaymentWatcher';
import type { Appointment, Payment } from '@/types/database';

export const metadata: Metadata = {
  title: 'Booking confirmation',
  robots: { index: false, follow: false },
};

/**
 * Post-payment screen.
 *
 * Three outcomes, and none of them leaves the user on an ambiguous screen —
 * which the brief calls out specifically:
 *
 *   confirmed  everything worked; show the full booking detail
 *   pending    verify did not settle but the webhook almost certainly will.
 *              Poll rather than telling someone their payment failed when it
 *              did not — that is the single worst message we could show here.
 *   attention  payment succeeded but the slot was lost. Say so plainly, state
 *              that the money is safe, and give an immediate human contact.
 */
export default async function ConfirmPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  /**
   * NO LONGER requireUser().
   *
   * Booking does not create a session, so demanding one here would mean
   * bouncing someone to a login screen in the seconds after they have paid —
   * the single worst moment in the product to do it.
   *
   * Access is granted by EITHER of two independent proofs, and never by the
   * appointment id alone:
   *
   *   1. a signed capability token in the URL (see lib/booking/access-token.ts)
   *   2. a real session whose user owns the row
   *
   * The `order` lookup keeps the session requirement, because a Razorpay order
   * id is not something we mint a token for and a booking link always carries
   * the appointment id. An unauthenticated visitor arriving on the order path
   * lands on the "could not find that booking" panel with a phone number,
   * which is correct: we genuinely cannot prove who they are.
   */
  const profile = await getProfile();

  const appointmentId = typeof searchParams.appointment === 'string' ? searchParams.appointment : null;
  const orderId = typeof searchParams.order === 'string' ? searchParams.order : null;
  const state = typeof searchParams.state === 'string' ? searchParams.state : null;
  const token = typeof searchParams.t === 'string' ? searchParams.t : null;

  const admin = createAdminClient();

  let appointment: Appointment | null = null;
  let payment: Payment | null = null;

  if (appointmentId) {
    const hasToken = isValidBookingToken(appointmentId, token);

    // The row is fetched only once one of the two proofs holds. Fetching first
    // and checking afterwards would work, but it puts every client's booking a
    // single forgotten `if` away from being served to a stranger — references
    // are sequential, so that mistake is immediately exploitable.
    if (hasToken || profile) {
      let query = admin
        .from('appointments')
        .select('*, payments(*)')
        .eq('id', appointmentId);

      // Without a token, ownership is the proof — unchanged from before.
      if (!hasToken && profile) query = query.eq('user_id', profile.id);

      const { data } = await query.maybeSingle();
      if (data) {
        const { payments, ...rest } = data as Appointment & { payments: Payment[] };
        appointment = rest;
        payment = payments?.find((p) => ['paid', 'partially_refunded', 'refunded'].includes(p.status)) ?? payments?.[0] ?? null;
      }
    }
  } else if (orderId && profile) {
    const { data } = await admin
      .from('payments')
      .select('*, appointments(*)')
      .eq('provider_order_id', orderId)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (data) {
      const { appointments, ...rest } = data as Payment & { appointments: Appointment };
      payment = rest as Payment;
      appointment = appointments;
    }
  }

  if (!appointment) {
    return (
      <Shell>
        <InlineAlert tone="warning" title="We could not find that booking">
          It may still be processing, or this link may be incomplete. Call us on{' '}
          {BRAND.phones[0]} and we will look it up straight away — if money has left
          your account, the booking exists and we can find it.
        </InlineAlert>
        {/*
          A phone number, not a dashboard link. This panel is reached by exactly
          the people who have no session — a truncated link, a copied URL that
          lost its token — so sending them to /dashboard sends them to /login,
          which is no help at all when they are worried they have just paid for
          nothing.
        */}
        <Button asChild className="mt-6">
          <a href={`tel:${BRAND.phonesE164[0]}`}>
            <Phone aria-hidden /> Call {BRAND.phones[0]}
          </a>
        </Button>
        {profile && (
          <Button asChild variant="secondary" className="mt-3 sm:ml-3 sm:mt-6">
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
        )}
      </Shell>
    );
  }

  const isConfirmed = appointment.status === 'confirmed';
  const needsAttention = appointment.status === 'needs_attention' || state === 'attention';
  const isPending = !isConfirmed && !needsAttention;

  // ------------------------------- ATTENTION -------------------------------
  if (needsAttention) {
    return (
      <Shell>
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-warning-container)]">
          <TriangleAlert className="size-6 text-[var(--color-warning)]" aria-hidden />
        </div>
        <h1 className="mt-6 text-[length:var(--text-h1)]">We need to rearrange your time</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-body-warm)]">
          Your payment went through, but the slot you chose was taken moments before it
          completed. That is our error, not yours.
        </p>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-body-warm)]">
          <strong>Your money is safe.</strong> We will call you shortly to arrange another
          time. If you would rather have a full refund instead, tell us and it will be
          processed the same day.
        </p>

        <BookingFacts appointment={appointment} payment={payment} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={`tel:${BRAND.phonesE164[0]}`}>
              <Phone aria-hidden /> Call {BRAND.phones[0]}
            </a>
          </Button>
          {profile && (
            <Button asChild size="lg" variant="secondary">
              <Link href="/dashboard">Go to my dashboard</Link>
            </Button>
          )}
        </div>
      </Shell>
    );
  }

  // -------------------------------- PENDING --------------------------------
  if (isPending) {
    return (
      <Shell>
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-outline-variant)]">
          <Clock className="size-6 text-[var(--color-body-warm)]" aria-hidden />
        </div>
        <h1 className="mt-6 text-[length:var(--text-h1)]">Confirming your payment</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-body-warm)]">
          Your payment is being confirmed with the bank. This usually takes a few seconds.
          You do not need to pay again — if anything was debited, it is recorded.
        </p>

        <PendingPaymentWatcher appointmentId={appointment.id} accessToken={token} />

        <BookingFacts appointment={appointment} payment={payment} />

        <p className="mt-6 text-sm text-[var(--color-body-warm)]">
          Taking longer than a minute? Call {BRAND.phones[0]} and we will confirm it manually.
        </p>
      </Shell>
    );
  }

  // ------------------------------- CONFIRMED -------------------------------
  return (
    <Shell>
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-success-container)]">
        <CheckCircle2 className="size-6 text-[var(--color-success)]" aria-hidden />
      </div>
      <h1 className="mt-6 text-[length:var(--text-h1)]">You&apos;re booked in</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-body-warm)]">
        Your booking details are on their way to{' '}
        {appointment.contact_phone ? 'WhatsApp and your email' : 'your email'}. Komal will
        send the joining link before your session.
      </p>

      <BookingFacts appointment={appointment} payment={payment} />

      <div className="mt-8 space-y-3">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
          What happens next
        </h2>
        <ol className="space-y-2 text-sm leading-relaxed text-[var(--color-body-warm)]">
          <li>
            1. Your booking details arrive on WhatsApp
            {appointment.contact_phone ? ` at ${appointment.contact_phone}` : ''} and by email.
          </li>
          <li>2. A joining link is sent before your appointment.</li>
          <li>3. A reminder arrives 24 hours beforehand.</li>
          <li>4. Find somewhere quiet where you will not be interrupted.</li>
        </ol>
      </div>

      {/*
        The dashboard links are shown only to someone who can actually open
        them. A guest reached this page with a capability token, not a session,
        so "View my booking" would drop them on a login screen seconds after
        paying — precisely the interruption this whole change removed. They keep
        this page's URL instead, which is in their WhatsApp message and email.
      */}
      {profile ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/dashboard/appointments/${appointment.id}`}>
              <CalendarPlus aria-hidden /> View my booking
            </Link>
          </Button>
          {payment?.receipt_number && (
            <Button asChild size="lg" variant="secondary">
              <Link href={`/dashboard/payments/${payment.id}/receipt`}>
                <Download aria-hidden /> Download receipt
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-8 border border-[var(--color-outline-variant)] bg-white px-5 py-4 text-sm leading-relaxed text-[var(--color-body-warm)]">
          Keep this page — the same link is in your WhatsApp message and email, and it
          opens your booking any time. Reference{' '}
          <strong className="font-semibold text-[var(--color-cocoa)]">{appointment.reference}</strong>.
        </p>
      )}

      <p className="mt-8 border-t border-[var(--color-outline-variant)] pt-6 text-xs leading-relaxed text-[var(--color-body-warm)]">
        {POLICY.cancellationSummary} {POLICY.refundTiming}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-card-cream)]">
      <main id="main" className="mx-auto max-w-2xl px-5 py-16 lg:py-24">{children}</main>
    </div>
  );
}

function BookingFacts({ appointment, payment }: { appointment: Appointment; payment: Payment | null }) {
  const facts: [string, string][] = [
    ['Booking reference', appointment.reference],
    ['Service', appointment.service_title_snapshot],
    ['Date', formatLongDay(appointment.starts_at)],
    ['Time', `${formatTime(appointment.starts_at)} – ${formatTime(appointment.ends_at)} IST`],
    ['Amount', formatPaise(appointment.total_paise)],
  ];
  if (payment?.provider_payment_id) facts.push(['Payment ID', payment.provider_payment_id]);
  if (payment?.receipt_number) facts.push(['Receipt', payment.receipt_number]);

  return (
    <dl className="mt-8 divide-y divide-[var(--color-outline-variant)]  border border-[var(--color-outline-variant)] bg-white">
      {facts.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <dt className="text-sm text-[var(--color-body-warm)]">{label}</dt>
          <dd className="tabular text-right text-sm font-medium text-[var(--color-cocoa)] break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
