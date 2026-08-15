import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getPaymentsForAdmin, getRevenueSummary } from '@/lib/booking/queries';
import { formatPaisePrecise, formatPaiseCompact } from '@/lib/money';
import { formatDateTime } from '@/lib/date';
import { PageHeader, StatCard } from '@/components/dashboard/AppShell';
import { PaymentStatusBadge } from '@/components/ui/badge';
import { TableShell, Table, Th, Td, Tbody, FilterBar } from '@/components/admin/DataTable';
import { EmptyState } from '@/components/ui/states';
import { Field, Select, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { RefundDialog } from './RefundDialog';

export const metadata = { title: 'Payments', robots: { index: false } };

/**
 * Financial management.
 *
 * The money screen. Amounts are shown to two decimal places here (unlike the
 * marketing pages, which round) because reconciling against a bank statement
 * needs exact figures.
 */
export default async function AdminPaymentsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;

  const status = typeof params.status === 'string' ? params.status : 'all';
  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';

  const now = new Date();
  const rangeFrom = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeTo = to ? new Date(to) : new Date(now.getTime() + 864e5);

  const [payments, summary] = await Promise.all([
    getPaymentsForAdmin({
      status,
      from: from ? rangeFrom.toISOString() : undefined,
      to: to ? rangeTo.toISOString() : undefined,
      limit: 200,
    }),
    getRevenueSummary(rangeFrom, rangeTo),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Payments"
        description="Every transaction, its status, and the controls to refund or reconcile it."
      />

      <section aria-label="Period summary" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Net revenue" value={formatPaiseCompact(summary?.net_paise ?? 0)} sublabel="After refunds" />
        <StatCard label="Gross" value={formatPaiseCompact(summary?.gross_paise ?? 0)} sublabel={`${summary?.paid_count ?? 0} paid`} />
        <StatCard label="Refunded" value={formatPaiseCompact(summary?.refunded_paise ?? 0)} sublabel={`${summary?.refund_count ?? 0} refunds`} tone={summary?.refunded_paise ? 'warning' : 'neutral'} />
        <StatCard label="Failed" value={String(summary?.failed_count ?? 0)} tone={summary?.failed_count ? 'danger' : 'neutral'} sublabel="Attempts that did not complete" />
        <StatCard label="Average booking" value={formatPaiseCompact(summary?.avg_order_paise ?? 0)} />
      </section>

      <div className="mt-8">
        <FilterBar>
          <Field label="Status" htmlFor="p-status" className="w-44">
            <Select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partly refunded</option>
            </Select>
          </Field>
          <Field label="From" htmlFor="p-from" className="w-40">
            <Input name="from" type="date" defaultValue={from} />
          </Field>
          <Field label="To" htmlFor="p-to" className="w-40">
            <Input name="to" type="date" defaultValue={to} />
          </Field>
          <Button type="submit" variant="secondary">Apply</Button>
          {(status !== 'all' || from || to) && (
            <Button asChild variant="ghost"><Link href="/admin/payments">Clear</Link></Button>
          )}
        </FilterBar>

        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments match" description="Try a wider date range or a different status." />
        ) : (
          <TableShell>
            <Table caption="Payments">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Client</Th>
                  <Th>Booking</Th>
                  <Th>Transaction</Th>
                  <Th>Status</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Refunded</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <Tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-warm-ivory)]">
                    <Td>
                      <span className="block text-xs">{formatDateTime(p.paid_at ?? p.created_at)}</span>
                    </Td>
                    <Td>
                      {p.profiles ? (
                        <Link href={`/admin/clients/${p.profiles.id}`} className="block max-w-[160px] truncate text-sm font-medium hover:text-[var(--color-gold-deep)]">
                          {p.profiles.full_name ?? p.profiles.email}
                        </Link>
                      ) : '—'}
                    </Td>
                    <Td>
                      <span className="block max-w-[150px] truncate text-sm">{p.appointments?.service_title_snapshot ?? '—'}</span>
                      <span className="block text-xs text-[var(--color-on-surface-variant)]">{p.appointments?.reference}</span>
                    </Td>
                    <Td>
                      <span className="block max-w-[150px] truncate font-mono text-[11px] text-[var(--color-on-surface-variant)]">
                        {p.provider_payment_id ?? p.provider_order_id ?? '—'}
                      </span>
                      {p.method && <span className="block text-[11px] uppercase text-[var(--color-on-surface-variant)]">{p.method}</span>}
                    </Td>
                    <Td>
                      <PaymentStatusBadge status={p.status} />
                      {p.status === 'failed' && p.error_description && (
                        <span className="mt-1 block max-w-[150px] truncate text-[11px] text-[var(--color-error)]" title={p.error_description}>
                          {p.error_description}
                        </span>
                      )}
                    </Td>
                    <Td align="right"><span className="tabular text-sm font-medium">{formatPaisePrecise(p.amount_paise)}</span></Td>
                    <Td align="right">
                      {p.amount_refunded_paise > 0 ? (
                        <span className="tabular text-sm text-[var(--color-cosmic-navy)]">{formatPaisePrecise(p.amount_refunded_paise)}</span>
                      ) : <span className="text-xs text-[var(--color-on-surface-variant)]">—</span>}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        {['paid', 'partially_refunded'].includes(p.status) && (
                          <RefundDialog
                            paymentId={p.id}
                            amountPaise={p.amount_paise}
                            refundedPaise={p.amount_refunded_paise}
                            clientName={p.profiles?.full_name ?? 'this client'}
                          />
                        )}
                        {p.receipt_number && p.appointments && (
                          <Link
                            href={`/admin/appointments?ref=${p.appointments.reference}`}
                            className="text-xs font-medium text-[var(--color-gold-deep)] hover:underline"
                          >
                            Booking
                          </Link>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </TableShell>
        )}
      </div>
    </div>
  );
}
