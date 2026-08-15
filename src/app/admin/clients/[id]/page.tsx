import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock, Mail, Phone } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPaise, formatPaisePrecise } from '@/lib/money';
import { formatDate, formatDateTime, formatLongDay, formatTime } from '@/lib/date';
import { StatCard } from '@/components/dashboard/AppShell';
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { ClientNotes } from './ClientNotes';
import type { Appointment, AppointmentNote, Payment, Profile } from '@/types/database';

export const metadata = { title: 'Client', robots: { index: false } };

/**
 * Client record — the screen Komal opens before a session.
 *
 * Consolidates what would otherwise be a scramble through WhatsApp: who they
 * are, their birth details, every previous session, what they paid, and the
 * private notes from last time.
 */
export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const db = createAdminClient();

  const [{ data: client }, { data: appointments }, { data: payments }, { data: notes }] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).maybeSingle<Profile>(),
    db.from('appointments').select('*').eq('user_id', id).order('starts_at', { ascending: false }).returns<Appointment[]>(),
    db.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false }).returns<Payment[]>(),
    db.from('appointment_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }).returns<AppointmentNote[]>(),
  ]);

  if (!client) notFound();

  const completed = (appointments ?? []).filter((a) => a.status === 'completed').length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bark)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="size-3.5" aria-hidden /> All clients
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-linen)] pb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight">
            {client.full_name ?? 'Unnamed client'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--color-bark)]">
            <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-[var(--color-ember-text)]">
              <Mail className="size-3.5" aria-hidden /> {client.email}
            </a>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-[var(--color-ember-text)]">
                <Phone className="size-3.5" aria-hidden /> {client.phone}
              </a>
            )}
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-stone)]">Client since {formatDate(client.created_at)}</p>
        </div>
      </header>

      <section aria-label="Summary" className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions completed" value={String(completed)} />
        <StatCard label="Total bookings" value={String(appointments?.length ?? 0)} />
        <StatCard label="Lifetime value" value={formatPaise(client.total_spent_paise)} sublabel="Net of refunds" />
      </section>

      {/* Birth details — the sensitive block, visually separated and labelled. */}
      {(client.birth_date || client.birth_place) && (
        <section aria-labelledby="birth-heading" className="mt-8">
          <h2 id="birth-heading" className="flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
            <Lock className="size-3" aria-hidden /> Birth details
          </h2>
          <dl className="mt-3 grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--color-stone)]">Date</dt>
              <dd className="mt-0.5 text-sm font-medium">{client.birth_date ? formatDate(client.birth_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-stone)]">Time</dt>
              <dd className="tabular mt-0.5 text-sm font-medium">
                {client.birth_time_known ? (client.birth_time ?? '—') : 'Not known'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-stone)]">Place</dt>
              <dd className="mt-0.5 text-sm font-medium">{client.birth_place ?? '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
            Consultation history
          </h2>
          {appointments && appointments.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-linen)] rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white">
              {appointments.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.service_title_snapshot}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-stone)]">
                        {formatLongDay(a.starts_at)} · <span className="tabular">{formatTime(a.starts_at)}</span>
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                  {a.client_question && (
                    <p className="mt-2 line-clamp-2 text-xs italic leading-relaxed text-[var(--color-bark)]">
                      &ldquo;{a.client_question}&rdquo;
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3"><EmptyState title="No bookings yet" /></div>
          )}
        </section>

        <section aria-labelledby="payments-heading">
          <h2 id="payments-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-stone)]">
            Payment history
          </h2>
          {payments && payments.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--color-linen)] rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="tabular text-sm font-medium">{formatPaisePrecise(p.amount_paise)}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-stone)]">
                      {formatDateTime(p.paid_at ?? p.created_at)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3"><EmptyState title="No payments yet" /></div>
          )}
        </section>
      </div>

      <ClientNotes clientId={client.id} notes={client.notes ?? ''} sessionNotes={notes ?? []} />
    </div>
  );
}
