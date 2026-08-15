import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { getMyAppointments } from '@/lib/booking/queries';
import { formatLongDay, formatTime, isPast } from '@/lib/date';
import { formatPaise } from '@/lib/money';
import { PageHeader } from '@/components/dashboard/AppShell';
import { AppointmentStatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Appointments', robots: { index: false } };

export default async function AppointmentsPage() {
  const appointments = await getMyAppointments();

  const groups = {
    Upcoming: appointments.filter((a) => ['confirmed', 'pending_payment', 'needs_attention'].includes(a.status) && !isPast(a.starts_at)),
    Past: appointments.filter((a) => a.status === 'completed' || (isPast(a.starts_at) && a.status === 'confirmed')),
    Cancelled: appointments.filter((a) => ['cancelled', 'no_show'].includes(a.status)),
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Appointments"
        description="Everything you have booked, past and upcoming."
        action={<Button asChild><Link href="/book">Book a session</Link></Button>}
      />

      {appointments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            description="Once you book a consultation it will appear here, along with the joining details and your receipt."
            action={{ label: 'Book a consultation', href: '/book' }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {Object.entries(groups).map(([label, list]) =>
            list.length === 0 ? null : (
              <section key={label} aria-labelledby={`group-${label}`}>
                <h2 id={`group-${label}`} className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
                  {label} ({list.length})
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {list.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/dashboard/appointments/${a.id}`}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white px-5 py-4 transition-colors hover:border-[var(--color-ember)]/40"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <p className="font-sans text-[15px] font-semibold">{a.service_title_snapshot}</p>
                            <AppointmentStatusBadge status={a.status} />
                          </div>
                          <p className="mt-1 text-sm text-[var(--color-bark)]">
                            {formatLongDay(a.starts_at)} · <span className="tabular">{formatTime(a.starts_at)}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-stone)]">Reference {a.reference}</p>
                        </div>
                        <p className="tabular text-sm font-semibold">{formatPaise(a.total_paise)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
