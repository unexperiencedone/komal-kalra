import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Video } from 'lucide-react';
import { getMyAppointment } from '@/lib/booking/queries';
import { createClient } from '@/lib/supabase/server';
import { formatPaise, formatPaisePrecise } from '@/lib/money';
import { formatDate, formatLongDay, formatTime, hoursUntil, isPast } from '@/lib/date';
import { POLICY } from '@/lib/config';
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import { CancelBookingForm } from './CancelBookingForm';
import type { Payment } from '@/types/database';

export const metadata = { title: 'Booking', robots: { index: false } };

export default async function AppointmentDetailPage(props: { params: Promise<{ id: string }> }) {
  // Next.js 16: params is a Promise.
  const { id } = await props.params;

  // RLS scopes this to the signed-in user, so no explicit ownership filter is
  // needed — and cannot be forgotten.
  const appointment = await getMyAppointment(id);
  if (!appointment) notFound();

  const supabase = await createClient();
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('appointment_id', id)
    .order('created_at', { ascending: false })
    .returns<Payment[]>();

  const payment = payments?.[0] ?? null;
  const windowHours = POLICY.freeCancellationHours;
  const canCancel = ['confirmed', 'pending_payment'].includes(appointment.status) && !isPast(appointment.starts_at);
  const refundEligible = hoursUntil(appointment.starts_at) >= windowHours;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-body-warm)] hover:text-[var(--color-cocoa)]"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All appointments
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight">
            {appointment.service_title_snapshot}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-body-warm)]">Reference {appointment.reference}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      {appointment.status === 'needs_attention' && (
        <div className="mt-6">
          <InlineAlert tone="warning" title="This booking needs attention">
            Your payment was received but the time could not be secured. Your money is safe —
            we will contact you to rearrange, or refund you in full if you prefer.
          </InlineAlert>
        </div>
      )}

      {appointment.reschedule_requested_at && (
        <div className="mt-6">
          <InlineAlert tone="info" title="Reschedule requested">
            We have your request and will be in touch to confirm a new time.
          </InlineAlert>
        </div>
      )}

      <section aria-label="Appointment details" className="mt-8  border border-[var(--color-outline-variant)] bg-white">
        <dl className="divide-y divide-[var(--color-outline-variant)]">
          <Row label="Date">{formatLongDay(appointment.starts_at)}</Row>
          <Row label="Time">
            <span className="tabular">{formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)} IST</span>
          </Row>
          <Row label="Duration">{appointment.duration_minutes} minutes</Row>
          <Row label="Format">
            {appointment.services?.mode === 'phone' ? 'Phone call'
              : appointment.services?.mode === 'in_person' ? 'In person' : 'Video call'}
          </Row>
          {appointment.client_question && <Row label="Your question">{appointment.client_question}</Row>}
          {appointment.subject_birth_date && (
            <Row label="Birth details">
              {formatDate(appointment.subject_birth_date)}
              {appointment.subject_birth_time_known && appointment.subject_birth_time
                ? ` at ${appointment.subject_birth_time}`: ' (time not known)'}
              {appointment.subject_birth_place ? ` · ${appointment.subject_birth_place}` : ''}
            </Row>
          )}
        </dl>
      </section>

      {appointment.meeting_url && appointment.status === 'confirmed' && (
        <div className="mt-6">
          <Button asChild size="lg" full>
            <a href={appointment.meeting_url} target="_blank" rel="noopener noreferrer">
              <Video aria-hidden /> Join your session
            </a>
          </Button>
        </div>
      )}

      <section aria-labelledby="payment-heading" className="mt-8">
        <h2 id="payment-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
          Payment
        </h2>
        <div className="mt-3  border border-[var(--color-outline-variant)] bg-white">
          <dl className="divide-y divide-[var(--color-outline-variant)]">
            <Row label="Consultation fee">
              <span className="tabular">{formatPaise(appointment.price_paise)}</span>
            </Row>
            {appointment.discount_paise > 0 && (
              <Row label="Discount">
                <span className="tabular text-[var(--color-success)]">−{formatPaise(appointment.discount_paise)}</span>
              </Row>
            )}
            {appointment.tax_paise > 0 && (
              <Row label="Tax"><span className="tabular">{formatPaise(appointment.tax_paise)}</span></Row>
            )}
            <Row label="Total">
              <span className="tabular font-semibold">{formatPaisePrecise(appointment.total_paise)}</span>
            </Row>
            <Row label="Status">
              <PaymentStatusBadge status={appointment.payment_status} />
            </Row>
            {payment?.receipt_number && <Row label="Receipt">{payment.receipt_number}</Row>}
            {payment && payment.amount_refunded_paise > 0 && (
              <Row label="Refunded">
                <span className="tabular text-[var(--color-cocoa)]">
                  {formatPaisePrecise(payment.amount_refunded_paise)}
                </span>
              </Row>
            )}
          </dl>
        </div>
      </section>

      {canCancel && (
        <section aria-labelledby="manage-heading" className="mt-8">
          <h2 id="manage-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
            Manage this booking
          </h2>
          <div className="mt-3  border border-[var(--color-outline-variant)] bg-white p-5">
            <p className="text-sm leading-relaxed text-[var(--color-body-warm)]">
              {refundEligible
                ? `Cancelling now is free and a full refund will be requested. ${POLICY.refundTiming}`: `Your session is within ${windowHours} hours, so the fee is non-refundable. You can still cancel, or ask us to reschedule instead.`}
            </p>
            <CancelBookingForm appointmentId={appointment.id} refundEligible={refundEligible} />
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-[var(--color-body-warm)]">{label}</dt>
      <dd className="max-w-md text-right text-sm text-[var(--color-cocoa)]">{children}</dd>
    </div>
  );
}
