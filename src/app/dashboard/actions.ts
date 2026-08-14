'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { profileSchema } from '@/lib/validation/schemas';
import { queueNotification } from '@/lib/notifications/outbox';
import { POLICY } from '@/lib/config';
import { hoursUntil } from '@/lib/date';

export type ActionState = { error?: string; success?: string } | null;

/**
 * Profile update.
 *
 * Uses the ANON-key client, not the service role. That is deliberate: RLS then
 * enforces that a user can only write their own row, so a bug in this function
 * cannot become a way to edit someone else's profile. The `role` column is
 * additionally protected by protect_profile_role() at the database level.
 */
export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || '',
    birthDate: formData.get('birthDate') || '',
    birthTime: formData.get('birthTime') || '',
    birthPlace: formData.get('birthPlace') || '',
    birthTimeKnown: formData.get('birthTimeKnown') === 'on',
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the details you entered.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      birth_date: parsed.data.birthDate || null,
      birth_time: parsed.data.birthTimeKnown ? parsed.data.birthTime || null : null,
      birth_place: parsed.data.birthPlace || null,
      birth_time_known: parsed.data.birthTimeKnown,
      marketing_opt_in: parsed.data.marketingOptIn,
    })
    .eq('id', (await supabase.auth.getUser()).data.user!.id);

  if (error) return { error: 'We could not save those changes. Please try again.' };

  revalidatePath('/dashboard/profile');
  return { success: 'Your details have been saved.' };
}

/**
 * Client-initiated cancellation.
 *
 * The refund decision is made HERE, on the server, from the appointment's own
 * start time — never from anything the browser sends. A client cannot cancel
 * two hours before a session and claim they were inside the free window.
 *
 * Refunds are not issued automatically even when eligible: they are queued for
 * admin action. For a solo practice, a human glance at every outgoing refund is
 * worth more than the automation, and it prevents an abuse loop of
 * book-and-cancel.
 */
export async function cancelAppointment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireUser();
  const appointmentId = String(formData.get('appointmentId') ?? '');
  const reason = String(formData.get('reason') ?? '').slice(0, 500);

  if (!appointmentId) return { error: 'Missing booking reference.' };

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from('appointments')
    .select('*, services(free_cancellation_hours)')
    .eq('id', appointmentId)
    .eq('user_id', profile.id)   // ownership
    .maybeSingle();

  if (!appointment) return { error: 'We could not find that booking.' };
  if (!['confirmed', 'pending_payment'].includes(appointment.status)) {
    return { error: 'This booking can no longer be cancelled. Please call us.' };
  }

  const windowHours =
    (appointment.services as { free_cancellation_hours: number | null } | null)?.free_cancellation_hours
    ?? POLICY.freeCancellationHours;

  const eligibleForRefund = hoursUntil(appointment.starts_at) >= windowHours;

  await admin
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: profile.id,
      cancellation_reason: reason || 'Cancelled by client',
    })
    .eq('id', appointmentId);

  // Free the slot immediately so someone else can take it.
  await admin
    .from('slot_holds')
    .update({ released_at: new Date().toISOString() })
    .eq('converted_appointment_id', appointmentId);

  await admin.from('notifications').insert({
    user_id: profile.id,
    title: 'Booking cancelled',
    message: eligibleForRefund
      ? 'Your booking has been cancelled and a full refund has been requested. It usually settles in 5–7 working days.'
      : 'Your booking has been cancelled. As this was inside the cancellation window, the fee is non-refundable — but you are welcome to rebook.',
    action_url: '/dashboard/appointments',
    category: 'booking',
  });

  // Flag it for the admin to action rather than refunding automatically.
  if (eligibleForRefund) {
    await admin.from('admin_logs').insert({
      admin_id: null,
      action: 'appointment.cancelled_refund_due',
      entity_type: 'appointment',
      entity_id: appointmentId,
      metadata: {
        cancelled_by: profile.id,
        hours_before: Math.round(hoursUntil(appointment.starts_at)),
        window_hours: windowHours,
        total_paise: appointment.total_paise,
      },
    });
  }

  await queueNotification({
    template: 'appointment_cancelled',
    appointmentId,
    dedupeKey: `cancelled:${appointmentId}`,
  });

  revalidatePath('/dashboard/appointments');
  revalidatePath(`/dashboard/appointments/${appointmentId}`);

  return {
    success: eligibleForRefund
      ? 'Your booking has been cancelled and a refund has been requested.'
      : 'Your booking has been cancelled.',
  };
}

/** Reschedule requests are a request, not a self-service change — the calendar
 *  is a single practitioner's, and a silent self-move can strand a session. */
export async function requestReschedule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireUser();
  const appointmentId = String(formData.get('appointmentId') ?? '');
  const preferred = String(formData.get('preferred') ?? '').slice(0, 300);

  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!appointment || appointment.status !== 'confirmed') {
    return { error: 'This booking cannot be rescheduled. Please call us.' };
  }

  await admin
    .from('appointments')
    .update({
      reschedule_requested_at: new Date().toISOString(),
      meeting_notes: preferred ? `Reschedule requested. Preferred: ${preferred}` : 'Reschedule requested.',
    })
    .eq('id', appointmentId);

  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  return { success: 'We have received your request and will be in touch to arrange a new time.' };
}
