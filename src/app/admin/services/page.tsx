import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/dashboard/AppShell';
import { ServiceEditor } from './ServiceEditor';
import type { Service } from '@/types/database';

export const metadata = { title: 'Services', robots: { index: false } };

export default async function AdminServicesPage() {
  await requireAdmin();
  const db = createAdminClient();

  // Service role, so inactive services are visible here (RLS hides them publicly).
  const { data, error } = await db
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .returns<Service[]>();

  if (error) console.error('[admin] services read failed:', error.message);

  /**
   * Archived rows are split out in JavaScript rather than with
   * `.is('archived_at', null)` in the query.
   *
   * A deploy can be running ahead of its migration, and a PostgREST filter on a
   * column that does not exist yet returns 400 — which previously emptied the
   * entire catalogue silently. Reading the field off the row degrades to
   * "nothing is archived" instead, which is both correct and harmless.
   */
  const all = data ?? [];
  const live = all.filter((s) => !s.archived_at);
  const archived = all.filter((s) => Boolean(s.archived_at));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Services"
        description="Your consultation catalogue. Prices and durations here are what visitors see and pay."
      />
      <div className="mt-8">
        <ServiceEditor services={live} archived={archived} />
      </div>
    </div>
  );
}
