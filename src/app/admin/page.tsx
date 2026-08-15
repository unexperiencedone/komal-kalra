import Link from 'next/link';
import {
  AlertTriangle, CalendarDays, ClipboardClock, IndianRupee, Users, UserPlus,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPendingActions, getRevenueSummary, getTodaysAppointments, getAppointmentsForAdmin,
} from '@/lib/booking/queries';
import { formatPaise, formatPaiseCompact } from '@/lib/money';
import { formatTime, formatDate, relativeTime } from '@/lib/date';
import { PageHeader, StatCard } from '@/components/dashboard/AppShell';
import { AppointmentStatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Admin overview', robots: { index: false } };

/**
 * Admin home.
 *
 * Ordered by what needs a decision, not by what is interesting. "Pending
 * actions" sits above the revenue tiles because a payment that succeeded
 * without securing a slot is worth more of Komal's attention than this month's
 * total — and a dashboard that buries the urgent item under a chart is a
 * dashboard nobody trusts.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const tomorrow = new Date(startOfToday); tomorrow.setDate(tomorrow.getDate() + 1);

  const [today, upcoming, pending, revToday, revWeek, revMonth, clients] = await Promise.all([
    getTodaysAppointments(),
    getAppointmentsForAdmin({ status: 'confirmed', from: tomorrow.toISOString(), limit: 6 }),
    getPendingActions(),
    getRevenueSummary(startOfToday, tomorrow),
    getRevenueSummary(startOfWeek, tomorrow),
    getRevenueSummary(startOfMonth, tomorrow),
    createAdminClient().from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const clientCount = clients.count ?? 0;

  const actionCount =
    pending.needsAttention.count + pending.failedPayments.count +
    pending.newLeads.count + pending.pendingTestimonials.count;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Overview"
        description={`${today.length} ${today.length === 1 ? 'appointment' : 'appointments'} today · ${formatDate(now)}`}
        action={<Button asChild variant="secondary"><Link href="/admin/appointments">All appointments</Link></Button>}
      />

      {/* ---- Needs a decision ---- */}
      {actionCount > 0 && (
        <section aria-labelledby="actions-heading" className="mt-8">
          <h2 id="actions-heading" className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
            <AlertTriangle className="size-3.5 text-[var(--color-warning)]" aria-hidden />
            Pending actions ({actionCount})
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionTile
              count={pending.needsAttention.count}
              label="Bookings need attention"
              detail="Paid, but the slot was lost. Refund or re-slot."
              href="/admin/appointments?status=needs_attention"
              tone="danger"
            />
            <ActionTile
              count={pending.failedPayments.count}
              label="Failed payments (7 days)"
              detail="Worth a follow-up call."
              href="/admin/payments?status=failed"
              tone="warning"
            />
            <ActionTile
              count={pending.newLeads.count}
              label="New enquiries"
              detail="Waiting for a first reply."
              href="/admin/leads?status=new"
              tone="accent"
            />
            <ActionTile
              count={pending.pendingTestimonials.count}
              label="Reviews to approve"
              detail="Nothing publishes until you approve it."
              href="/admin/testimonials"
              tone="neutral"
            />
          </div>
        </section>
      )}

      {/* ---- Revenue ---- */}
      <section aria-labelledby="revenue-heading" className="mt-8">
        <h2 id="revenue-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
          Revenue
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Clients"
            value={String(clientCount)}
            pill="All time"
            icon={Users}
            sublabel={`${revMonth?.paid_count ?? 0} paid bookings this month`}
          />
          <StatCard
            label="Pending Requests"
            value={String(actionCount)}
            pill={actionCount > 0 ? 'Action Needed' : 'Clear'}
            icon={ClipboardClock}
            tone={actionCount > 0 ? 'warning' : 'neutral'}
            sublabel={actionCount > 0 ? 'Requires attention today' : 'Nothing waiting on you'}
          />
          {/* The one inverted tile — revenue is the figure Komal opens this
              page for. More than one navy tile and the emphasis stops meaning
              anything. */}
          <StatCard
            label="Monthly Revenue"
            value={formatPaiseCompact(revMonth?.net_paise ?? 0)}
            pill="This month"
            icon={IndianRupee}
            inverted
            sublabel={`Today ${formatPaise(revToday?.net_paise ?? 0)} · This week ${formatPaiseCompact(revWeek?.net_paise ?? 0)}`}
          />
        </div>
        {(revMonth?.conversion_rate ?? 100) < 25 && (revMonth?.attempt_count ?? 0) > 10 && (
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-warning)]">
            Conversion below 25% usually means there is friction in the booking flow rather
            than a demand problem. The Analytics page breaks down where attempts stop.
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ---- Today ---- */}
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
            Today&apos;s schedule
          </h2>
          {today.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-outline-variant)]  border border-[var(--color-outline-variant)] bg-white">
              {today.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/appointments?ref=${a.reference}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-warm-ivory)]">
                    <span className="tabular w-16 shrink-0 text-sm font-semibold">{formatTime(a.starts_at)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.profiles?.full_name ?? 'Client'}</span>
                      <span className="block truncate text-xs text-[var(--color-on-surface-variant)]">{a.service_title_snapshot}</span>
                    </span>
                    <AppointmentStatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState icon={CalendarDays} title="Nothing scheduled today" description="A clear day. Upcoming bookings are listed alongside." />
            </div>
          )}
        </section>

        {/* ---- Upcoming ---- */}
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
            Coming up
          </h2>
          {upcoming.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-outline-variant)]  border border-[var(--color-outline-variant)] bg-white">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.profiles?.full_name ?? 'Client'}</p>
                    <p className="truncate text-xs text-[var(--color-on-surface-variant)]">
                      {a.service_title_snapshot} · {relativeTime(a.starts_at)}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-xs text-[var(--color-on-surface-variant)]">
                    {formatDate(a.starts_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState icon={UserPlus} title="No upcoming bookings" description="New bookings will appear here as they come in." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ActionTile({ count, label, detail, href, tone }: {
  count: number; label: string; detail: string; href: string;
  tone: 'danger' | 'warning' | 'accent' | 'neutral';
}) {
  if (count === 0) return null;
  const tones = {
    danger: 'border-[var(--color-error)]/30 bg-[var(--color-error-container)]',
    warning: 'border-[var(--color-warning)]/30 bg-[var(--color-warning-container)]',
    accent: 'border-[var(--color-muted-gold)]/30 bg-[var(--color-linen-grey)]',
    neutral: 'border-[var(--color-outline-variant)] bg-white',
  };
  return (
    <Link href={href} className={`block  border p-4 transition-shadow hover: ${tones[tone]}`}>
      <p className="tabular font-[family-name:var(--font-display)] text-2xl font-semibold">{count}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-cosmic-navy)]">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-on-surface-variant)]">{detail}</p>
    </Link>
  );
}
