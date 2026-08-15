import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRevenueByService, getRevenueSummary, getRevenueTimeseries } from '@/lib/booking/queries';
import { formatPaise, formatPaiseCompact } from '@/lib/money';
import { PageHeader, StatCard } from '@/components/dashboard/AppShell';
import { RevenueChart } from './RevenueChart';
import { InlineAlert } from '@/components/ui/states';

export const metadata = { title: 'Analytics', robots: { index: false } };

/**
 * Business analytics.
 *
 * Deliberately small. A solo practitioner needs to answer four questions:
 * what did I earn, which service earns it, is the booking flow leaking, and are
 * people coming back. Everything else is dashboard theatre, so it is not built.
 *
 * All aggregation happens in Postgres (revenue_summary, revenue_by_service,
 * revenue_timeseries) rather than by pulling every payment row into Node.
 */
export default async function AdminAnalyticsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;
  const days = Math.min(Number(params.days ?? 30) || 30, 365);

  const to = new Date(); to.setHours(23, 59, 59, 999);
  const from = new Date(to); from.setDate(from.getDate() - days);
  const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - days);

  const db = createAdminClient();

  const [summary, previous, byService, timeseries, repeatData] = await Promise.all([
    getRevenueSummary(from, to),
    getRevenueSummary(prevFrom, from),
    getRevenueByService(from, to),
    getRevenueTimeseries(from, to),
    db.from('profiles').select('appointments_count').gt('appointments_count', 0),
  ]);

  const clients = repeatData.data ?? [];
  const repeatClients = clients.filter((c) => (c.appointments_count as number) > 1).length;
  const repeatRate = clients.length > 0 ? Math.round((repeatClients / clients.length) * 100) : 0;

  const growth =
    previous && previous.net_paise > 0
      ? Math.round(((summary!.net_paise - previous.net_paise) / previous.net_paise) * 100)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Analytics"
        description={`Last ${days} days, compared with the ${days} days before.`}
      />

      <nav aria-label="Time period" className="mt-6 flex gap-2">
        {[7, 30, 90, 365].map((d) => (
          <a
            key={d}
            href={`/admin/analytics?days=${d}`}
            aria-current={days === d ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              days === d
                ? 'bg-[var(--color-cosmic-navy)] text-[var(--color-warm-ivory)]'
                : 'bg-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]'
            }`}
          >
            {d === 365 ? '1 year' : `${d} days`}
          </a>
        ))}
      </nav>

      <section aria-label="Key figures" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net revenue"
          value={formatPaiseCompact(summary?.net_paise ?? 0)}
          sublabel={growth !== null ? `${growth >= 0 ? '+' : ''}${growth}% vs previous period` : 'No prior data to compare'}
          tone={growth !== null && growth < 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Paid bookings"
          value={String(summary?.paid_count ?? 0)}
          sublabel={`${summary?.attempt_count ?? 0} checkout attempts`}
        />
        <StatCard
          label="Average booking"
          value={formatPaiseCompact(summary?.avg_order_paise ?? 0)}
        />
        <StatCard
          label="Repeat clients"
          value={`${repeatRate}%`}
          sublabel={`${repeatClients} of ${clients.length} have booked more than once`}
        />
      </section>

      {/*
        Conversion is surfaced with the benchmark attached, because a bare
        percentage does not tell anyone whether to act. Below 25% indicates real
        friction in the flow rather than a demand problem (research §3.1).
      */}
      {(summary?.attempt_count ?? 0) > 10 && (
        <div className="mt-6">
          <InlineAlert tone={(summary?.conversion_rate ?? 0) < 25 ? 'warning' : 'success'}>
            <strong>{summary?.conversion_rate}% of checkouts completed.</strong>{' '}
            {(summary?.conversion_rate ?? 0) < 25
              ? `${summary?.failed_count ?? 0} payments failed and others were abandoned. Anything under 25% usually points at friction in the flow — check the Leads page for abandoned bookings and call a few to find out what stopped them.`: 'That is a healthy completion rate for a paid consultation flow.'}
          </InlineAlert>
        </div>
      )}

      <section aria-labelledby="chart-heading" className="mt-8">
        <h2 id="chart-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
          Revenue over time
        </h2>
        <div className="mt-3  border border-[var(--color-outline-variant)] bg-white p-5">
          <RevenueChart data={timeseries} />
        </div>
      </section>

      <section aria-labelledby="service-heading" className="mt-8">
        <h2 id="service-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
          Revenue by service
        </h2>
        {byService.length === 0 ? (
          <p className="mt-3  border border-dashed border-[var(--color-outline-variant)] p-10 text-center text-sm text-[var(--color-on-surface-variant)]">
            No paid bookings in this period.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-outline-variant)]  border border-[var(--color-outline-variant)] bg-white">
            {byService.map((row) => {
              const share = summary?.net_paise ? Math.round((row.net_paise / summary.net_paise) * 100) : 0;
              return (
                <li key={row.service_title} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{row.service_title}</span>
                    <span className="tabular text-sm font-semibold">{formatPaise(row.net_paise)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-outline-variant)]">
                      <div className="h-full rounded-full bg-[var(--color-muted-gold)]" style={{ width: `${share}%` }} />
                    </div>
                    <span className="tabular w-24 shrink-0 text-right text-xs text-[var(--color-on-surface-variant)]">
                      {row.bookings} {row.bookings === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
