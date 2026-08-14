import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatPaisePrecise } from '@/lib/money';
import { formatDateTime, formatLongDay, formatTime } from '@/lib/date';
import { BRAND } from '@/lib/config';
import { PrintButton } from './PrintButton';
import type { Appointment, Payment, Profile } from '@/types/database';

export const metadata = { title: 'Receipt', robots: { index: false } };

/**
 * Receipt / invoice.
 *
 * Rendered as a print-optimised HTML page rather than a generated PDF. For a
 * receipt this is strictly better: it works on every device, needs no server
 * PDF toolchain, is selectable and searchable, and "Save as PDF" is one step
 * away in every browser's print dialog.
 *
 * Access is controlled by RLS — the query returns nothing for a payment that is
 * not the caller's, and this page 404s rather than revealing that the id exists.
 */
export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('payments')
    .select('*, appointments(*), profiles!payments_user_id_fkey(full_name, email, phone)')
    .eq('id', id)
    .maybeSingle<Payment & { appointments: Appointment | null; profiles: Pick<Profile, 'full_name' | 'email' | 'phone'> | null }>();

  if (!data || !['paid', 'partially_refunded', 'refunded'].includes(data.status)) notFound();

  const appointment = data.appointments;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 lg:py-14">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <article className="rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-8 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-linen)] pb-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold">{BRAND.fullName}</p>
            <p className="mt-1 text-xs text-[var(--color-stone)]">{BRAND.phones[0]} · {BRAND.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-stone)]">Receipt</p>
            <p className="tabular mt-1 text-sm font-semibold">{data.receipt_number ?? data.id.slice(0, 8).toUpperCase()}</p>
            <p className="mt-0.5 text-xs text-[var(--color-stone)]">
              {data.paid_at ? formatDateTime(data.paid_at) : formatDateTime(data.created_at)}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-[var(--color-linen)] py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">Billed to</p>
            <p className="mt-2 text-sm font-medium">{data.profiles?.full_name ?? '—'}</p>
            <p className="text-sm text-[var(--color-bark)]">{data.profiles?.email}</p>
            {data.profiles?.phone && <p className="text-sm text-[var(--color-bark)]">{data.profiles.phone}</p>}
          </div>
          {appointment && (
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">Booking</p>
              <p className="mt-2 text-sm font-medium">{appointment.reference}</p>
              <p className="text-sm text-[var(--color-bark)]">{formatLongDay(appointment.starts_at)}</p>
              <p className="tabular text-sm text-[var(--color-bark)]">{formatTime(appointment.starts_at)} IST</p>
            </div>
          )}
        </section>

        <table className="w-full border-b border-[var(--color-linen)] py-6 text-sm">
          <caption className="sr-only">Payment breakdown</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-stone)]">
              <th scope="col" className="py-3 font-semibold">Description</th>
              <th scope="col" className="py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-linen)]">
            <tr>
              <td className="py-3">
                {appointment?.service_title_snapshot ?? 'Consultation'}
                {appointment && (
                  <span className="block text-xs text-[var(--color-stone)]">{appointment.duration_minutes} minutes</span>
                )}
              </td>
              <td className="tabular py-3 text-right">{formatPaisePrecise(appointment?.price_paise ?? data.amount_paise)}</td>
            </tr>
            {appointment && appointment.discount_paise > 0 && (
              <tr>
                <td className="py-3 text-[var(--color-sage)]">Discount</td>
                <td className="tabular py-3 text-right text-[var(--color-sage)]">
                  −{formatPaisePrecise(appointment.discount_paise)}
                </td>
              </tr>
            )}
            {appointment && appointment.tax_paise > 0 && (
              <tr>
                <td className="py-3">GST</td>
                <td className="tabular py-3 text-right">{formatPaisePrecise(appointment.tax_paise)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-ink)]">
              <th scope="row" className="py-3.5 text-left font-semibold">Total paid</th>
              <td className="tabular py-3.5 text-right font-[family-name:var(--font-display)] text-lg font-semibold">
                {formatPaisePrecise(data.amount_paise)}
              </td>
            </tr>
            {data.amount_refunded_paise > 0 && (
              <tr>
                <th scope="row" className="py-2 text-left text-sm font-medium text-[var(--color-indigo)]">Refunded</th>
                <td className="tabular py-2 text-right text-sm text-[var(--color-indigo)]">
                  −{formatPaisePrecise(data.amount_refunded_paise)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>

        <footer className="pt-6 text-xs leading-relaxed text-[var(--color-stone)]">
          <p>
            Payment method: {data.method ? data.method.toUpperCase() : 'Online'}
            {data.provider_payment_id && ` · Transaction ${data.provider_payment_id}`}
          </p>
          <p className="mt-2">
            This is a computer-generated receipt and is valid without a signature. For any
            queries about this payment, call {BRAND.phones[0]} quoting the receipt number above.
          </p>
        </footer>
      </article>
    </div>
  );
}
