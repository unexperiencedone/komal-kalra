import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { bookingLink } from '@/lib/booking/access-token';
import type { Appointment, Payment, Profile } from '@/types/database';

/**
 * Outbound notifications.
 *
 * Queue-first by design. Nothing is sent inline from a webhook or a payment
 * path, for one specific reason: if sending an email inline fails, the handler
 * either swallows the error (losing the notification) or returns non-2xx —
 * which makes Razorpay redeliver the payment event indefinitely
 * (docs/research.md §4.3.3). Queuing decouples "the money is settled" from
 * "the email went out".
 *
 * Every queued row carries a `dedupe_key` with a UNIQUE constraint, so the
 * verify path and the webhook path both attempting to queue the same
 * confirmation results in exactly one email.
 *
 * Email is implemented. WhatsApp and SMS are modelled but not wired: WhatsApp
 * needs a Business API/BSP contract and SMS needs DLT template registration in
 * India. Both are `channel` values the worker will pick up once a sender exists.
 */

export type NotificationTemplate =
  | 'booking_confirmed'
  /** Komal's own copy of a new booking. Never sent to a client. */
  | 'booking_alert_admin'
  | 'booking_needs_attention'
  | 'payment_failed'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'refund_issued'
  | 'lead_received';

export interface QueueArgs {
  template: NotificationTemplate;
  dedupeKey: string;
  appointmentId?: string;
  paymentId?: string;
  userId?: string;
  /** Email/phone override; otherwise resolved from the related profile. */
  recipient?: string;
  channel?: 'email' | 'whatsapp' | 'sms';
  payload?: Record<string, unknown>;
  /** Schedules the message N hours BEFORE the appointment start (reminders). */
  offsetHoursBeforeStart?: number;
}

export async function queueNotification(args: QueueArgs): Promise<void> {
  try {
    const admin = createAdminClient();

    let recipient = args.recipient ?? null;
    let userId = args.userId ?? null;
    let scheduledFor = new Date();
    const payload: Record<string, unknown> = { ...(args.payload ?? {}) };

    if (args.appointmentId) {
      const { data } = await admin
        .from('appointments')
        .select('*, profiles!appointments_user_id_fkey(id, email, full_name, phone)')
        .eq('id', args.appointmentId)
        .maybeSingle<Appointment & { profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'phone'> | null }>();

      if (data) {
        userId ??= data.user_id;

        // Contact details captured for THIS booking take precedence over the
        // profile. The profile is shared across bookings and mutable; the
        // snapshot is what the client actually typed this time. See
        // database/29_booking_contact.sql.
        const channel = args.channel ?? 'email';
        recipient ??=
          channel === 'whatsapp'
            ? data.contact_phone ?? data.profiles?.phone ?? null
            : data.contact_email ?? data.profiles?.email ?? null;

        payload.appointment = {
          id: data.id,
          reference: data.reference,
          service: data.service_title_snapshot,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          total_paise: data.total_paise,
          meeting_url: data.meeting_url,
          name: data.profiles?.full_name ?? null,
          // Everything below is for the WhatsApp templates. `link` carries its
          // own capability token, so it opens the booking without a login —
          // which is the whole point of sending it to someone who has no
          // account. `question` and `contact_phone` are for Komal's copy only;
          // the client template never renders them.
          link: bookingLink(data.id),
          contact_phone: data.contact_phone ?? data.profiles?.phone ?? null,
          question: data.client_question,
        };

        if (args.offsetHoursBeforeStart) {
          const target = new Date(
            new Date(data.starts_at).getTime() - args.offsetHoursBeforeStart * 3_600_000,
          );
          // A reminder whose send time is already past is pointless — mark it
          // scheduled for now and let the worker skip it if the slot has passed.
          scheduledFor = target.getTime() > Date.now() ? target : new Date();
        }
      }
    }

    if (args.paymentId) {
      const { data } = await admin
        .from('payments')
        .select('*, profiles!payments_user_id_fkey(id, email, full_name)')
        .eq('id', args.paymentId)
        .maybeSingle<Payment & { profiles: Pick<Profile, 'id' | 'email' | 'full_name'> | null }>();

      if (data) {
        userId ??= data.user_id;
        recipient ??= data.profiles?.email ?? null;
        payload.payment = {
          id: data.id,
          receipt_number: data.receipt_number,
          amount_paise: data.amount_paise,
          amount_refunded_paise: data.amount_refunded_paise,
          status: data.status,
          name: data.profiles?.full_name ?? null,
        };
      }
    }

    if (!recipient) {
      // Nothing to send to. Not an error — an admin-created booking for a
      // walk-in client may legitimately have no email on file.
      return;
    }

    await admin.from('notification_outbox').insert({
      user_id: userId,
      channel: args.channel ?? 'email',
      recipient,
      template: args.template,
      payload,
      dedupe_key: args.dedupeKey,
      scheduled_for: scheduledFor.toISOString(),
    });
  } catch (error) {
    // Unique violation on dedupe_key is the expected, healthy case when both
    // the verify path and the webhook fire. Anything else is logged and
    // swallowed: a notification failure must never fail the payment.
    const code = (error as { code?: string })?.code;
    if (code !== '23505') {
      console.error('[outbox] queue failed', args.template, error);
    }
  }
}

/** Marks in-app notification rows read. Used by the dashboard bell. */
export async function markNotificationsRead(userId: string, ids?: string[]) {
  const admin = createAdminClient();
  let query = admin
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);

  if (ids?.length) query = query.in('id', ids);
  await query;
}
