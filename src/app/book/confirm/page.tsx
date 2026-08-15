import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarPlus, CheckCircle2, Clock, Download, Phone, TriangleAlert } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
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
  const profile = await requireUser('/dashboard');

  const appointmentId = typeof searchParams.appointment === 'string' ? searchParams.appointment : null;
  const orderId = typeof searchParams.order === 'string' ? searchParams.order : null;
  const state = typeof searchParams.state === 'string' ? searchParams.state : null;

  const admin = createAdminClient();

  let appointment: Appointment | null = null;
  let payment: Payment | null = null;

  if (appointmentId) {
    const { data } = await admin
      .from('appointments')
      .select('*, payments(*)')
      .eq('id', appointmentId)
      .eq('user_id', profile.id)   // ownership, enforced server-side
      .maybeSingle();
    if (data) {
      const { payments, ...rest } = data as Appointment & { payments: Payment[] };
      appointment = rest;
      payment = payments?.find((p) => ['paid', 'partially_refunded', 'refunded'].includes(p.status)) ?? payments?.[0] ?? null;
    }
  } else if (orderId) {
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
          It may still be processing. Check your dashboard in a moment, or call us on{' '}
          {BRAND.phones[0]} and we will look it up straight away.
        </InlineAlert>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to my dashboard</Link>
        </Button>
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
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-amber-tint)]">
          <TriangleAlert className="size-6 text-[var(--color-amber-warn)]" aria-hidden />
        </div>
        <h1 className="mt-6 text-[length:var(--text-h1)]">We need to rearrange your time</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-bark)]">
          Your payment went through, but the slot you chose was taken moments before it
          completed. That is our error, not yours.
        </p>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-bark)]">
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
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  // -------------------------------- PENDING --------------------------------
  if (isPending) {
    return (
      <Shell>
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-linen)]">
          <Clock className="size-6 text-[var(--color-bark)]" aria-hidden />
        </div>
        <h1 className="mt-6 text-[length:var(--text-h1)]">Confirming your payment</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-bark)]">
          Your payment is being confirmed with the bank. This usually takes a few seconds.
          You do not need to pay again — if anything was debited, it is recorded.
        </p>

        <PendingPaymentWatcher appointmentId={appointment.id} />

        <BookingFacts appointment={appointment} payment={payment} />

        <p className="mt-6 text-sm text-[var(--color-stone)]">
          Taking longer than a minute? Call {BRAND.phones[0]} and we will confirm it manually.
        </p>
      </Shell>
    );
  }

  // ------------------------------- CONFIRMED -------------------------------
  return (
    <Shell>
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-jade-tint)]">
        <CheckCircle2 className="size-6 text-[var(--color-jade)]" aria-hidden />
      </div>
      <h1 className="mt-6 text-[length:var(--text-h1)]">You&apos;re booked in</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-bark)]">
        A confirmation is on its way to your email. Komal will send the joining link before
        your session.
      </p>

      <BookingFacts appointment={appointment} payment={payment} />

      <div className="mt-8 space-y-3">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
          What happens next
        </h2>
        <ol className="space-y-2 text-sm leading-relaxed text-[var(--color-bark)]">
          <li>1. You will receive a confirmation email with your booking reference.</li>
          <li>2. A joining link is sent before your appointment.</li>
          <li>3. A reminder arrives 24 hours beforehand.</li>
          <li>4. Find somewhere quiet where you will not be interrupted.</li>
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={`/dashboard/appointments/${appointment.id}`}>
            <CalendarPlus aria-hidden /> View my booking
          </Link>
        </Button>
        {payment?.receipt_number && (
          <Button asChild size="lg" variant="outline">
            <Link href={`/dashboard/payments/${payment.id}/receipt`}>
              <Download aria-hidden /> Download receipt
            </Link>
          </Button>
        )}
      </div>

      <p className="mt-8 border-t border-[var(--color-linen)] pt-6 text-xs leading-relaxed text-[var(--color-stone)]">
        {POLICY.cancellationSummary} {POLICY.refundTiming}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-sand)]">
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
    <dl className="mt-8 divide-y divide-[var(--color-linen)] rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white">
      {facts.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <dt className="text-sm text-[var(--color-stone)]">{label}</dt>
          <dd className="tabular text-right text-sm font-medium text-[var(--color-ink)] break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
