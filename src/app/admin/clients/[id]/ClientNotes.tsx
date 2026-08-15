'use client';

import { useActionState } from 'react';
import { Lock } from 'lucide-react';
import { saveClientNote, type AdminActionState } from '@/app/admin/actions';
import { Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import { formatDateTime } from '@/lib/date';
import type { AppointmentNote } from '@/types/database';

/**
 * Private notes.
 *
 * These are admin-only at the database level — appointment_notes has no
 * owner-read RLS policy, so a client cannot reach them even by querying
 * PostgREST directly. The lock icon is a reminder of that, not a substitute.
 */
export function ClientNotes({
  clientId, notes, sessionNotes,
}: {
  clientId: string;
  notes: string;
  sessionNotes: AppointmentNote[];
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveClientNote, null);

  return (
    <section aria-labelledby="notes-heading" className="mt-8">
      <h2 id="notes-heading" className="flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
        <Lock className="size-3" aria-hidden /> Private notes
      </h2>
      <p className="mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
        Visible only to you. The client can never see these.
      </p>

      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="clientId" value={clientId} />
        {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}
        {state?.success && <InlineAlert tone="success">{state.success}</InlineAlert>}

        <Textarea
          name="notes"
          defaultValue={notes}
          rows={5}
          aria-label="Private notes about this client"
          placeholder="Anything worth remembering before the next session…"
        />
        <Button type="submit" size="sm" loading={pending} loadingText="Saving…">Save note</Button>
      </form>

      {sessionNotes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]">
            Session notes
          </h3>
          <ul className="mt-2 space-y-2">
            {sessionNotes.map((n) => (
              <li key={n.id} className="border border-[var(--color-outline-variant)] bg-white p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-on-surface-variant)]">{n.body}</p>
                <p className="mt-2 text-[11px] text-[var(--color-on-surface-variant)]">{formatDateTime(n.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
