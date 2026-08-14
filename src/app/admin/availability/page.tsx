import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/dashboard/AppShell';
import { AvailabilityManager } from './AvailabilityManager';
import type { AvailabilityException, AvailabilityRule } from '@/types/database';

export const metadata = { title: 'Availability', robots: { index: false } };

/**
 * Availability.
 *
 * Two concepts, kept separate on purpose (docs/research.md §9.5):
 *   Working hours  a recurring weekly pattern — the normal case
 *   Exceptions     one-off blocks (a holiday) and one-off extra hours
 *
 * Bookable slots are derived from these minus existing bookings. Nothing is
 * stored per-date, so changing Tuesday hours is one edit rather than 52.
 */
export default async function AdminAvailabilityPage() {
  await requireAdmin();
  const db = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    db.from('availability_rules').select('*')
      .order('weekday').order('start_time').returns<AvailabilityRule[]>(),
    db.from('availability_exceptions').select('*')
      .gte('date', today).order('date').returns<AvailabilityException[]>(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Availability"
        description="When you can be booked. Slots on the website are worked out from these hours minus anything already booked."
      />
      <div className="mt-8">
        <AvailabilityManager rules={rules ?? []} exceptions={exceptions ?? []} />
      </div>
    </div>
  );
}
