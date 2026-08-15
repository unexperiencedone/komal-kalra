import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPaise } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { PageHeader } from '@/components/dashboard/AppShell';
import { TableShell, Table, Th, Td, Tbody, FilterBar } from '@/components/admin/DataTable';
import { EmptyState } from '@/components/ui/states';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/types/database';

export const metadata = { title: 'Clients', robots: { index: false } };

export default async function AdminClientsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;
  const q = typeof params.q === 'string' ? params.q.trim() : '';

  const db = createAdminClient();
  let query = db
    .from('profiles')
    .select('*')
    .order('last_appointment_at', { ascending: false, nullsFirst: false })
    .limit(200);

  // Trigram indexes make these ILIKEs fast without a leading-wildcard seq scan.
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data } = await query.returns<Profile[]>();
  const clients = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader title="Clients" description="Everyone who has an account, with their history and spend." />

      <div className="mt-8">
        <FilterBar>
          <Field label="Search" htmlFor="c-q" className="w-72">
            <Input name="q" defaultValue={q} placeholder="Name, email or phone" type="search" />
          </Field>
          <Button type="submit" variant="outline">Search</Button>
          {q && <Button asChild variant="ghost"><Link href="/admin/clients">Clear</Link></Button>}
        </FilterBar>

        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? 'No clients match that search' : 'No clients yet'}
            description={q ? 'Try a partial name or the last few digits of a phone number.' : 'Clients appear here as soon as they create an account.'}
          />
        ) : (
          <TableShell>
            <Table caption="Clients">
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Contact</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right">Total spent</Th>
                  <Th>Last session</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <Tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-sand)]">
                    <Td>
                      <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-2">
                        <span className="text-sm font-medium hover:text-[var(--color-ember-text)]">
                          {c.full_name ?? 'Unnamed'}
                        </span>
                        {c.role === 'admin' && <Badge tone="info">Admin</Badge>}
                      </Link>
                    </Td>
                    <Td>
                      <span className="block max-w-[200px] truncate text-xs">{c.email}</span>
                      {c.phone && <span className="block text-xs text-[var(--color-stone)]">{c.phone}</span>}
                    </Td>
                    <Td align="right"><span className="tabular text-sm">{c.appointments_count}</span></Td>
                    <Td align="right"><span className="tabular text-sm font-medium">{formatPaise(c.total_spent_paise)}</span></Td>
                    <Td>
                      <span className="text-xs">
                        {c.last_appointment_at ? formatDate(c.last_appointment_at) : '—'}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-[var(--color-stone)]">{formatDate(c.created_at)}</span></Td>
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
