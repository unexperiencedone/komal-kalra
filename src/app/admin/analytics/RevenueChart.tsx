'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { paiseToRupees } from '@/lib/money';
import { Skeleton } from '@/components/ui/states';

/**
 * Revenue chart.
 *
 * Recharts is ~150 KB, so it is loaded dynamically with SSR off and lives ONLY
 * inside the admin analytics page. It never touches a public route's bundle
 * (docs/research.md §11).
 */
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});
const AreaChart = dynamic(() => import('recharts').then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });

export function RevenueChart({ data }: { data: { day: string; net_paise: number; bookings: number }[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: new Date(d.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: paiseToRupees(d.net_paise),
        bookings: d.bookings,
      })),
    [data],
  );

  const total = chartData.reduce((sum, d) => sum + d.revenue, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-center">
        <p className="max-w-xs text-sm leading-relaxed text-[var(--color-stone)]">
          No revenue recorded in this period. The chart will fill in as bookings are paid for.
        </p>
      </div>
    );
  }

  // The literal hex values below are the only ones outside globals.css, and
  // they are unavoidable: Recharts renders SVG attributes (stroke, fill) that
  // cannot resolve CSS custom properties. They mirror --color-saffron,
  // --color-linen and --color-stone. Keep them in sync if the palette changes.
  return (
    <div className="h-64 w-full">
      {/* A chart is not accessible on its own — the table above it carries the
          same numbers, and this description covers the trend. */}
      <p className="sr-only">
        Daily net revenue over the selected period, totalling ₹{total.toLocaleString('en-IN')}.
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C2762B" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#C2762B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1EAE0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B5E54' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: '#6B5E54' }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <Tooltip
            contentStyle={{
              borderRadius: 8, border: '1px solid #F1EAE0', fontSize: 13,
              boxShadow: '0 10px 15px -3px rgb(20 16 14 / 0.08)',
            }}
            // Recharts types the formatter value as a broad ValueType union, so
            // narrow rather than asserting.
            formatter={(value) => [
              `₹${Number(value ?? 0).toLocaleString('en-IN')}`,
              'Revenue',
            ]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#C2762B" strokeWidth={2} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
