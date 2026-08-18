import Link from 'next/link';
import { CreditCard, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatPaisePrecise } from '@/lib/money';
import { formatDateTime } from '@/lib/date';
import { PageHeader } from '@/components/dashboard/AppShell';
import { PaymentStatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import type { Payment, Appointment } from '@/types/database';

export const metadata = { title: 'Payments', robots: { index: false } };

type Row = Payment & { appointments: Pick<Appointment, 'reference' | 'service_title_snapshot' | 'starts_at'> | null };

export default async function PaymentsPage() {
  const supabase = await createClient();

  // RLS restricts this to the signed-in user's own payments.
  const { data } = await supabase
    .from('payments')
    .select('*, appointments(reference, service_title_snapshot, starts_at)')
    .order('created_at', { ascending: false })
    .returns<Row[]>();

  const payments = data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader title="Payments" description="Your payment history, receipts and any refunds." />

      {payments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Receipts for your consultations will appear here as soon as you book."
            action={{ label: 'Book a consultation', href: '/book' }}
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-2.5">
          {payments.map((p) => (
            <li key={p.id} className="border border-[var(--color-outline-variant)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-sans text-[15px] font-semibold">
                      {p.appointments?.service_title_snapshot ?? 'Consultation'}
                    </p>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-body-warm)]">
                    {formatDateTime(p.created_at)}
                    {p.appointments?.reference && ` · ${p.appointments.reference}`}
                    {p.method && ` · ${p.method.toUpperCase()}`}
                  </p>
                  {p.receipt_number && (
                    <p className="mt-0.5 text-xs text-[var(--color-body-warm)]">Receipt {p.receipt_number}</p>
                  )}
                  {p.status === 'failed' && p.error_description && (
                    <p className="mt-1.5 text-xs text-[var(--color-error)]">{p.error_description}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="tabular font-[family-name:var(--font-display)] text-lg font-semibold">
                    {formatPaisePrecise(p.amount_paise)}
                  </p>
                  {p.amount_refunded_paise > 0 && (
                    <p className="tabular mt-0.5 text-xs text-[var(--color-cocoa)]">
                      {formatPaisePrecise(p.amount_refunded_paise)} refunded
                    </p>
                  )}
                  {['paid', 'partially_refunded', 'refunded'].includes(p.status) && (
                    <Link
                      href={`/dashboard/payments/${p.id}/receipt`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-saffron-deep)] hover:underline"
                    >
                      <Download className="size-3" aria-hidden /> Receipt
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
