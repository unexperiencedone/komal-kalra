'use client';

import { useState } from 'react';
import { Check, Link2, MoreHorizontal, X } from 'lucide-react';
import { updateAppointmentStatus, saveMeetingLink } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import type { AppointmentWithClient } from '@/types/database';

/**
 * Per-row actions.
 *
 * Kept to the three things Komal actually does from a list view — mark done,
 * cancel, attach a joining link. Anything more nuanced belongs on the client
 * record, where there is room for context.
 *
 * Each action is a plain <form action={serverAction}>, so it works without
 * JavaScript and the authorisation check runs server-side regardless.
 */
export function AppointmentRowActions({ appointment }: { appointment: AppointmentWithClient }) {
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);

  const canComplete = appointment.status === 'confirmed';
  const canCancel = ['confirmed', 'pending_payment'].includes(appointment.status);

  if (linking) {
    return (
      <form action={saveMeetingLink} className="flex items-center gap-2">
        <input type="hidden" name="appointmentId" value={appointment.id} />
        <Input
          name="meetingUrl"
          type="url"
          defaultValue={appointment.meeting_url ?? ''}
          placeholder="https://meet.google.com/…"
          className="h-9 w-56 text-xs"
          aria-label="Meeting link"
        />
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setLinking(false)}>Cancel</Button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {open ? (
        <>
          <Button size="sm" variant="ghost" onClick={() => setLinking(true)} title="Add or edit meeting link">
            <Link2 aria-hidden /> Link
          </Button>

          {canComplete && (
            <form action={updateAppointmentStatus}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <input type="hidden" name="status" value="completed" />
              <Button type="submit" size="sm" variant="ghost" className="text-[var(--color-success)]">
                <Check aria-hidden /> Done
              </Button>
            </form>
          )}

          {canCancel && (
            <form action={updateAppointmentStatus}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button type="submit" size="sm" variant="ghost" className="text-[var(--color-error)]">
                <X aria-hidden /> Cancel
              </Button>
            </form>
          )}

          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Actions for ${appointment.reference}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      )}
    </div>
  );
}
