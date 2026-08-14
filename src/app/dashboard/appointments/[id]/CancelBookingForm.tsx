'use client';

import { useActionState, useState } from 'react';
import { cancelAppointment, requestReschedule, type ActionState } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Field, Textarea, Input } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/states';

/**
 * Cancel / reschedule.
 *
 * Cancelling asks for confirmation before it will submit. This is one of very
 * few genuinely destructive actions available to a client, and an accidental
 * tap on mobile costs them a session and us a refund.
 */
export function CancelBookingForm({
  appointmentId, refundEligible,
}: {
  appointmentId: string;
  refundEligible: boolean;
}) {
  const [mode, setMode] = useState<'idle' | 'cancel' | 'reschedule'>('idle');
  const [cancelState, cancelAction, cancelling] = useActionState<ActionState, FormData>(cancelAppointment, null);
  const [reschedState, reschedAction, rescheduling] = useActionState<ActionState, FormData>(requestReschedule, null);

  const state = cancelState ?? reschedState;

  if (state?.success) {
    return <div className="mt-4"><InlineAlert tone="success">{state.success}</InlineAlert></div>;
  }

  return (
    <div className="mt-5">
      {state?.error && <div className="mb-4"><InlineAlert tone="danger">{state.error}</InlineAlert></div>}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => setMode('reschedule')}>
            Request a different time
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMode('cancel')} className="text-[var(--color-clay)]">
            Cancel this booking
          </Button>
        </div>
      )}

      {mode === 'reschedule' && (
        <form action={reschedAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <Field
            label="When would suit you better?"
            htmlFor="preferred"
            hint="A day or a rough time is enough — we will confirm by phone or email."
          >
            <Input name="preferred" placeholder="e.g. next Tuesday afternoon" maxLength={300} />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" size="sm" loading={rescheduling} loadingText="Sending…">
              Send request
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>
              Never mind
            </Button>
          </div>
        </form>
      )}

      {mode === 'cancel' && (
        <form action={cancelAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <InlineAlert tone="warning" title="This cannot be undone">
            {refundEligible
              ? 'Your slot will be released and a full refund requested.'
              : 'Your slot will be released. As this is inside the cancellation window, the fee is non-refundable.'}
          </InlineAlert>
          <Field label="Reason (optional)" htmlFor="cancel-reason">
            <Textarea name="reason" rows={3} maxLength={500} placeholder="Helps us improve — entirely optional." />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" variant="destructive" size="sm" loading={cancelling} loadingText="Cancelling…">
              Yes, cancel my booking
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>
              Keep my booking
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
