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
  const { data } = await db
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .returns<Service[]>();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Services"
        description="Your consultation catalogue. Prices and durations here are what visitors see and pay."
      />
      <div className="mt-8">
        <ServiceEditor services={data ?? []} />
      </div>
    </div>
  );
}
