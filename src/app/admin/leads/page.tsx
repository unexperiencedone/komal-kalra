import Link from 'next/link';
import { UserRound, Phone, Mail } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateTime, relativeTime, formatLongDay } from '@/lib/date';
import { updateLead } from '@/app/admin/actions';
import { PageHeader } from '@/components/dashboard/AppShell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import type { Lead, LeadStatus } from '@/types/database';

export const metadata = { title: 'Leads', robots: { index: false } };

const STATUS_TONE: Record<LeadStatus, 'neutral' | 'warning' | 'accent' | 'success' | 'info'> = {
  new: 'warning', contacted: 'accent', qualified: 'info', converted: 'success', closed: 'neutral',
};

const SOURCE_LABEL: Record<string, string> = {
  contact_form: 'Contact form',
  abandoned_booking: 'Abandoned booking',
  phone: 'Phone',
  instagram: 'Instagram',
  referral: 'Referral',
  other: 'Other',
};

/**
 * Leads pipeline.
 *
 * Two kinds of lead live here, and the second is the interesting one:
 *
 *   contact_form       someone filled in the enquiry form
 *   abandoned_booking  someone picked a slot, entered their details, and did
 *                      not complete payment
 *
 * The second group is created automatically by expire_stale_holds() and is the
 * warmest lead the business has — they chose a service, a time, and typed their
 * phone number. Losing those silently is exactly what the research flagged
 * (docs/research.md §3.4).
 */
export default async function AdminLeadsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await props.searchParams;
  const status = typeof params.status === 'string' ? params.status : 'all';

  const db = createAdminClient();
  let query = db
    .from('leads')
    .select('*, services(title)')
    .order('created_at', { ascending: false })
    .limit(150);

  if (status !== 'all') query = query.eq('status', status);

  const { data } = await query.returns<(Lead & { services: { title: string } | null })[]>();
  const leads = data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Leads"
        description="Enquiries from the contact form, plus bookings that were started but never paid for."
      />

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {['all', 'new', 'contacted', 'qualified', 'converted', 'closed'].map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/leads' : `/admin/leads?status=${s}`}
            aria-current={status === s ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              status === s
                ? 'bg-[var(--color-cosmic-navy)] text-[var(--color-warm-ivory)]'
                : 'bg-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]'
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={UserRound}
            title={status === 'all' ? 'No leads yet' : `No ${status} leads`}
            description="Enquiries and abandoned bookings will collect here so none of them get lost."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="border border-[var(--color-outline-variant)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-sans text-[15px] font-semibold">{lead.name}</p>
                    <Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge>
                    <Badge tone={lead.source === 'abandoned_booking' ? 'warning' : 'neutral'}>
                      {SOURCE_LABEL[lead.source] ?? lead.source}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-gold-deep)]">
                        <Phone className="size-3.5" aria-hidden /> {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-gold-deep)]">
                        <Mail className="size-3.5" aria-hidden /> {lead.email}
                      </a>
                    )}
                  </div>

                  {lead.message && (
                    <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                      {lead.message}
                    </p>
                  )}

                  {/* Context that makes an abandoned booking actionable. */}
                  {lead.source === 'abandoned_booking' && (
                    <p className="mt-3  bg-[var(--color-warning-container)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-warning)]">
                      Wanted <strong>{lead.services?.title ?? 'a consultation'}</strong>
                      {lead.intended_slot_at && <> on <strong>{formatLongDay(lead.intended_slot_at)}</strong></>}
                      {' '}but did not complete payment. Worth a call.
                    </p>
                  )}

                  {lead.assigned_note && (
                    <p className="mt-3 border-l-2 border-[var(--color-outline-variant)] pl-3 text-xs italic text-[var(--color-on-surface-variant)]">
                      {lead.assigned_note}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-[var(--color-on-surface-variant)]">
                    {formatDateTime(lead.created_at)} · {relativeTime(lead.created_at)}
                  </p>
                </div>
              </div>

              <form action={updateLead} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--color-outline-variant)] pt-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <Field label="Status" htmlFor={`s-${lead.id}`} className="w-40">
                  <Select name="status" defaultValue={lead.status}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </Select>
                </Field>
                <Field label="Follow-up note" htmlFor={`n-${lead.id}`} className="min-w-[240px] flex-1">
                  <Textarea name="assignedNote" rows={2} defaultValue={lead.assigned_note ?? ''} placeholder="Called, left a message…" />
                </Field>
                <Button type="submit" size="sm" variant="secondary">Update</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
