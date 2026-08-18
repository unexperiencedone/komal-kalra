import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAppointmentsForAdmin } from '@/lib/booking/queries';
import { formatPaise } from '@/lib/money';
import { formatDate, formatTime } from '@/lib/date';
import { PageHeader } from '@/components/dashboard/AppShell';
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/ui/badge';
import { TableShell, Table, Th, Td, Tbody, FilterBar } from '@/components/admin/DataTable';
import { EmptyState } from '@/components/ui/states';
import { Field, Select, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { AppointmentRowActions } from './RowActions';

export const metadata = { title: 'Appointments', robots: { index: false } };

/**
 * Appointments table.
 *
 * Filters are plain GET query params on a real <form>, not client state. That
 * makes every filtered view linkable and shareable ("look at the needs_attention
 * ones"), survivable across a refresh, and free of client JavaScript.
 */
export default async function AdminAppointmentsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;

  const status = typeof params.status === 'string' ? params.status : 'all';
  const from = typeof params.from === 'string' ? params.from : '';
  const search = typeof params.ref === 'string' ? params.ref : '';

  const appointments = await getAppointmentsForAdmin({
    status,
    from: from ? new Date(from).toISOString() : undefined,
    search: search || undefined,
    limit: 200,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Appointments"
        description={`${appointments.length} ${appointments.length === 1 ? 'booking' : 'bookings'} matching your filters.`}
      />

      <div className="mt-8">
        <FilterBar>
          <Field label="Status" htmlFor="f-status" className="w-44">
            <Select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              <option value="pending_payment">Awaiting payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
              <option value="needs_attention">Needs attention</option>
            </Select>
          </Field>

          <Field label="From date" htmlFor="f-from" className="w-44">
            <Input name="from" type="date" defaultValue={from} />
          </Field>

          <Field label="Reference" htmlFor="f-ref" className="w-44">
            <Input name="ref" defaultValue={search} placeholder="KK-100123" />
          </Field>

          <Button type="submit" variant="secondary">Apply</Button>
          {(status !== 'all' || from || search) && (
            <Button asChild variant="ghost"><Link href="/admin/appointments">Clear</Link></Button>
          )}
        </FilterBar>

        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments match"
            description="Try widening the filters, or clear them to see everything."
          />
        ) : (
          <TableShell>
            <Table caption="Appointments">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <Tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--color-card-cream)]">
                    <Td>
                      <span className="block text-sm font-medium">{formatDate(a.starts_at)}</span>
                      <span className="tabular block text-xs text-[var(--color-body-warm)]">
                        {formatTime(a.starts_at)}
                      </span>
                    </Td>
                    <Td>
                      {a.profiles ? (
                        <Link href={`/admin/clients/${a.profiles.id}`} className="block max-w-[180px]">
                          <span className="block truncate text-sm font-medium hover:text-[var(--color-saffron-deep)]">
                            {a.profiles.full_name ?? 'Unnamed'}
                          </span>
                          <span className="block truncate text-xs text-[var(--color-body-warm)]">
                            {a.profiles.phone ?? a.profiles.email}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--color-body-warm)]">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="block max-w-[160px] truncate text-sm">{a.service_title_snapshot}</span>
                      <span className="block text-xs text-[var(--color-body-warm)]">{a.reference}</span>
                    </Td>
                    <Td><AppointmentStatusBadge status={a.status} /></Td>
                    <Td><PaymentStatusBadge status={a.payment_status} /></Td>
                    <Td align="right"><span className="tabular text-sm font-medium">{formatPaise(a.total_paise)}</span></Td>
                    <Td align="right"><AppointmentRowActions appointment={a} /></Td>
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
