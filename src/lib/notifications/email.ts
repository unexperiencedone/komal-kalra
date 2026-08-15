import 'server-only';
import { BRAND } from '@/lib/config';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NotificationTemplate } from './outbox';

/**
 * Email rendering and delivery.
 *
 * Delivery uses Resend when RESEND_API_KEY is set. Without it, messages stay
 * queued and are logged — the system degrades to "notifications are pending"
 * rather than pretending to have sent something. That distinction matters: a
 * fake "email sent" is worse than a visible backlog.
 */

interface RenderedEmail { subject: string; html: string; text: string }

type Payload = {
  appointment?: {
    name?: string;
    reference?: string;
    service?: string;
    starts_at?: string;
    total_paise?: number;
    meeting_url?: string;
  };
  payment?: {
    name?: string;
    amount_refunded_paise?: number;
    receipt_number?: string;
  };
};

const wrap = (title: string, body: string) => `
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body style="margin:0;padding:24px;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#14100E;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #F1EAE0;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 28px;border-bottom:1px solid #F1EAE0;">
      <div style="font-size:17px;font-weight:600;letter-spacing:-0.01em;">${BRAND.fullName}</div>
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.6;">${body}</div>
    <div style="padding:20px 28px;background:#FAF7F2;font-size:13px;color:#3D332C;line-height:1.6;">
      Questions? Call <a href="tel:${BRAND.phonesE164[0]}" style="color:#A45F1E;">${BRAND.phones[0]}</a>
      or reply to this email.
    </div>
  </div>
</body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#3D332C;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td></tr>`;

export function renderEmail(template: NotificationTemplate, payload: Payload): RenderedEmail {
  const appt = payload.appointment ?? {};
  const pay = payload.payment ?? {};
  const name = appt.name || pay.name || 'there';

  switch (template) {
    case 'booking_confirmed': {
      const when = appt.starts_at
        ? `${formatLongDay(appt.starts_at)} at ${formatTime(appt.starts_at)}`
        : 'the scheduled time';
      const details = `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        ${row('Booking reference', appt.reference ?? '—')}
        ${row('Service', appt.service ?? '—')}
        ${row('When', when)}
        ${row('Amount paid', appt.total_paise != null ? formatPaise(appt.total_paise) : '—')}
      </table>`;
      return {
        subject: `Your consultation is confirmed — ${appt.reference ?? ''}`.trim(),
        html: wrap('Booking confirmed', `
          <p>Hello ${name},</p>
          <p>Your consultation is confirmed. Here are the details:</p>
          ${details}
          ${appt.meeting_url ? `<p><a href="${appt.meeting_url}" style="display:inline-block;background:#C2762B;color:#fff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Join the session</a></p>` : '<p>A joining link will be sent before your session.</p>'}
          <p style="color:#3D332C;font-size:14px;">If you need to reschedule, you can do that from your dashboard up to 12 hours beforehand.</p>`),
        text: `Hello ${name},\n\nYour consultation is confirmed.\nReference: ${appt.reference}\nService: ${appt.service}\nWhen: ${when}\n\n— ${BRAND.fullName}`,
      };
    }

    case 'appointment_reminder': {
      const when = appt.starts_at ? formatTime(appt.starts_at) : '';
      return {
        subject: `Reminder: your consultation is tomorrow`,
        html: wrap('Reminder', `
          <p>Hello ${name},</p>
          <p>A quick reminder that your <strong>${appt.service ?? 'consultation'}</strong> is tomorrow at <strong>${when}</strong>.</p>
          ${appt.meeting_url ? `<p><a href="${appt.meeting_url}" style="color:#A45F1E;">Joining link</a></p>` : ''}
          <p style="color:#3D332C;font-size:14px;">Find somewhere quiet where you will not be interrupted.</p>`),
        text: `Reminder: your ${appt.service ?? 'consultation'} is tomorrow at ${when}.`,
      };
    }

    case 'payment_failed':
      return {
        subject: 'Your payment did not go through',
        html: wrap('Payment failed', `
          <p>Hello ${name},</p>
          <p>Your payment was not completed, so the time slot has been released. Nothing has been charged.</p>
          <p><a href="/book" style="color:#A45F1E;">Try booking again</a>, or call us and we will arrange it for you.</p>`),
        text: 'Your payment was not completed and nothing has been charged. The slot has been released.',
      };

    case 'booking_needs_attention':
      return {
        subject: 'We need to rearrange your booking',
        html: wrap('Booking needs attention', `
          <p>Hello ${name},</p>
          <p>Your payment went through, but the time you selected was taken moments before it completed. We are sorry — this is our error.</p>
          <p>We will call you shortly to arrange another time. If you would prefer a full refund instead, just say so and it will be processed the same day.</p>`),
        text: 'Your payment succeeded but the slot was taken. We will contact you to rearrange, or refund you in full if you prefer.',
      };

    case 'appointment_cancelled':
      return {
        subject: 'Your consultation has been cancelled',
        html: wrap('Cancelled', `
          <p>Hello ${name},</p>
          <p>Your ${appt.service ?? 'consultation'} has been cancelled. Any refund due will be processed to your original payment method.</p>`),
        text: 'Your consultation has been cancelled.',
      };

    case 'appointment_rescheduled':
      return {
        subject: 'Your consultation has been rescheduled',
        html: wrap('Rescheduled', `
          <p>Hello ${name},</p>
          <p>Your consultation has been moved to <strong>${appt.starts_at ? `${formatLongDay(appt.starts_at)} at ${formatTime(appt.starts_at)}` : 'a new time'}</strong>.</p>`),
        text: 'Your consultation has been rescheduled.',
      };

    case 'refund_issued': {
      const amount = pay.amount_refunded_paise != null ? formatPaise(pay.amount_refunded_paise) : '';
      return {
        subject: 'Your refund has been issued',
        html: wrap('Refund issued', `
          <p>Hello ${name},</p>
          <p>A refund of <strong>${amount}</strong> has been issued to your original payment method. It usually settles within 5–7 working days.</p>
          ${pay.receipt_number ? `<p style="color:#3D332C;font-size:14px;">Receipt: ${pay.receipt_number}</p>` : ''}`),
        text: `A refund of ${amount} has been issued and usually settles within 5–7 working days.`,
      };
    }

    case 'lead_received':
      return {
        subject: 'Thank you for getting in touch',
        html: wrap('Message received', `
          <p>Hello ${name},</p>
          <p>Thank you for your message. Komal reads every enquiry personally and will get back to you shortly.</p>
          <p style="color:#3D332C;font-size:14px;">If it is urgent, call ${BRAND.phones[0]}.</p>`),
        text: 'Thank you for your message. Komal will get back to you shortly.',
      };
  }
}

async function send(to: string, email: RenderedEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${BRAND.fullName} <onboarding@resend.dev>`;

  if (!key) {
    console.info('[email] RESEND_API_KEY not set; message left queued', { to, subject: email.subject });
    throw new Error('email_not_configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: email.subject, html: email.html, text: email.text }),
  });

  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
  }
}

/**
 * Outbox worker. Called by /api/cron/notifications.
 *
 * Claims rows by flipping them to `sending` before doing any network work, so
 * two overlapping cron runs cannot send the same message twice.
 */
export async function processOutbox(batchSize = 25) {
  const admin = createAdminClient();
  const summary = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  const { data: due } = await admin
    .from('notification_outbox')
    .select('*')
    .in('status', ['queued', 'failed'])
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', 5)
    .eq('channel', 'email')
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (!due?.length) return summary;

  for (const item of due) {
    summary.processed += 1;

    const { data: claimed } = await admin
      .from('notification_outbox')
      .update({ status: 'sending', attempts: item.attempts + 1 })
      .eq('id', item.id)
      .in('status', ['queued', 'failed'])
      .select('id')
      .maybeSingle();

    if (!claimed) { summary.skipped += 1; continue; }

    try {
      const rendered = renderEmail(item.template as NotificationTemplate, item.payload ?? {});
      await send(item.recipient, rendered);
      await admin
        .from('notification_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
        .eq('id', item.id);
      summary.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await admin
        .from('notification_outbox')
        .update({
          status: message === 'email_not_configured' ? 'queued' : 'failed',
          last_error: message.slice(0, 500),
        })
        .eq('id', item.id);
      summary.failed += 1;
    }
  }

  return summary;
}
