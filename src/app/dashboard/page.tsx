import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Bell, CalendarDays, CreditCard, Video } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getMyAppointments, getMyNotifications, getMyPayments } from '@/lib/booking/queries';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime, relativeTime, isPast } from '@/lib/date';
import { PageHeader, StatCard } from '@/components/dashboard/AppShell';
import { AppointmentStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, InlineAlert } from '@/components/ui/states';

export const metadata = { title: 'Overview', robots: { index: false } };

/**
 * Client overview.
 *
 * The most important thing on this page is the NEXT appointment — that is what
 * a client actually opens this page to find. Everything else is secondary and
 * sits below it.
 */
export default async function DashboardPage() {
  const profile = await requireUser('/dashboard');

  // An admin landing on /dashboard with no bookings of their own almost
  // certainly meant to go to the console.
  const [appointments, payments, notifications] = await Promise.all([
    getMyAppointments(),
    getMyPayments(),
    getMyNotifications(5),
  ]);

  if (profile.role === 'admin' && appointments.length === 0) redirect('/admin');

  const upcoming = appointments
    .filter((a) => ['confirmed', 'pending_payment'].includes(a.status) && !isPast(a.starts_at))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const next = upcoming[0];
  const past = appointments.filter((a) => a.status === 'completed');
  const needsAttention = appointments.filter((a) => a.status === 'needs_attention');
  const totalPaid = payments
    .filter((p) => ['paid', 'partially_refunded'].includes(p.status))
    .reduce((sum, p) => sum + p.amount_paise - p.amount_refunded_paise, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title={profile.full_name ? `Hello, ${profile.full_name.split(' ')[0]}` : 'Your account'}
        description="Your upcoming sessions, payments and account details."
        action={
          <Button asChild>
            <Link href="/book">Book another session</Link>
          </Button>
        }
      />

      {needsAttention.length > 0 && (
        <div className="mt-6">
          <InlineAlert tone="warning" title="One of your bookings needs attention">
            A payment went through but the time could not be secured. Komal&apos;s team will
            contact you — or call us and we will sort it out immediately.
          </InlineAlert>
        </div>
      )}

      {/* Next appointment — the reason this page exists. */}
      <section aria-labelledby="next-heading" className="mt-8">
        <h2 id="next-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
          Next appointment
        </h2>

        {next ? (
          <div className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-ember)]/30 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {next.service_title_snapshot}
                  </h3>
                  <AppointmentStatusBadge status={next.status} />
                </div>
                <p className="mt-2 text-[15px] text-[var(--color-bark)]">
                  {formatLongDay(next.starts_at)}
                </p>
                <p className="tabular mt-0.5 text-[15px] font-medium text-[var(--color-ink)]">
                  {formatTime(next.starts_at)} – {formatTime(next.ends_at)} IST
                </p>
                <p className="mt-2 text-xs text-[var(--color-stone)]">
                  Reference {next.reference} · {relativeTime(next.starts_at)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {next.meeting_url && next.status === 'confirmed' && (
                  <Button asChild>
                    <a href={next.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Video aria-hidden /> Join session
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/appointments/${next.id}`}>
                    Manage booking <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            {next.status === 'pending_payment' && (
              <div className="mt-5">
                <InlineAlert tone="warning">
                  This booking is not confirmed yet — the payment did not complete. It is not
                  holding your slot.
                </InlineAlert>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon={CalendarDays}
              title="No upcoming sessions"
              description="When you book a consultation it will appear here with the joining details."
              action={{ label: 'Book a consultation', href: '/book' }}
            />
          </div>
        )}
      </section>

      <section aria-label="Summary" className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value={String(upcoming.length)} icon={CalendarDays} />
        <StatCard label="Completed" value={String(past.length)} sublabel="Sessions attended" />
        <StatCard label="Total paid" value={formatPaise(totalPaid)} icon={CreditCard} sublabel="Net of refunds" />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
              Recent bookings
            </h2>
            <Link href="/dashboard/appointments" className="text-sm font-medium text-[var(--color-ember-text)] hover:underline">
              View all
            </Link>
          </div>

          {appointments.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-linen)] rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white">
              {appointments.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/appointments/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[var(--color-sand)]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.service_title_snapshot}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-stone)]">{formatLongDay(a.starts_at)}</p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState title="Nothing here yet" description="Your bookings will appear here." />
            </div>
          )}
        </section>

        <section aria-labelledby="notif-heading">
          <h2 id="notif-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
            Notifications
          </h2>

          {notifications.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-linen)] rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white">
              {notifications.map((n) => (
                <li key={n.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-stone)]">{n.message}</p>
                  <p className="mt-1 text-[11px] text-[var(--color-stone)]">{relativeTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState icon={Bell} title="No notifications" description="Booking and payment updates will show up here." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
