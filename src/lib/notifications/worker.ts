import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * The outbox drain loop, shared by every channel.
 *
 * Extracted so email and WhatsApp cannot drift apart on the part that is
 * actually delicate: CLAIMING a row. The naive version — select due rows, send,
 * mark sent — double-sends the moment two cron invocations overlap, which they
 * will, because a slow SMTP or WhatsApp call outlives a one-minute schedule.
 *
 * The claim below is a conditional UPDATE whose WHERE clause includes the
 * status it expects to find. Postgres serialises the two updates; the loser
 * gets zero rows back and skips. Same shape as the conditional update the
 * booking system uses, and the same reason for it.
 *
 * A duplicated confirmation is not a cosmetic bug here. On WhatsApp every
 * delivered template message is billed, and a client who receives their booking
 * details four times reasonably concludes something is wrong with the booking.
 */

export type OutboxChannel = 'email' | 'whatsapp' | 'sms';

export interface OutboxRow {
  id: string;
  channel: OutboxChannel;
  recipient: string;
  template: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export interface DrainSummary {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Thrown by a sender that has no credentials configured.
 *
 * Handled specially: the row goes back to `queued` rather than `failed`, and
 * its attempt count is not held against it, so the backlog delivers itself the
 * moment the keys arrive instead of having burned through five retries against
 * a provider that was never there.
 */
export class ChannelNotConfiguredError extends Error {
  constructor(channel: OutboxChannel) {
    super(`${channel}_not_configured`);
    this.name = 'ChannelNotConfiguredError';
  }
}

const MAX_ATTEMPTS = 5;

export async function drainOutbox(
  channel: OutboxChannel,
  /**
   * Returns the provider's message id where there is one, so a later delivery
   * receipt can be matched back to this row. Returning nothing is fine — email
   * has no equivalent — but discarding an id the provider DID give us means
   * "accepted" and "arrived" become indistinguishable forever after.
   */
  send: (row: OutboxRow) => Promise<string | null | void>,
  batchSize = 25,
): Promise<DrainSummary> {
  const admin = createAdminClient();
  const summary: DrainSummary = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  const { data: due } = await admin
    .from('notification_outbox')
    .select('*')
    .in('status', ['queued', 'failed'])
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .eq('channel', channel)
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (!due?.length) return summary;

  for (const item of due as OutboxRow[]) {
    summary.processed += 1;

    // Claim. `.in('status', …)` is the whole guard — without it two overlapping
    // cron runs both send this row.
    const { data: claimed } = await admin
      .from('notification_outbox')
      .update({ status: 'sending', attempts: item.attempts + 1 })
      .eq('id', item.id)
      .in('status', ['queued', 'failed'])
      .select('id')
      .maybeSingle();

    if (!claimed) { summary.skipped += 1; continue; }

    try {
      const providerMessageId = (await send(item)) || null;
      await admin
        .from('notification_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
          ...(providerMessageId ? { provider_message_id: providerMessageId } : {}),
        })
        .eq('id', item.id);
      summary.sent += 1;
    } catch (error) {
      const notConfigured = error instanceof ChannelNotConfiguredError;
      const message = error instanceof Error ? error.message : String(error);

      await admin
        .from('notification_outbox')
        .update({
          // Unconfigured is not a failure of this message — it is a failure to
          // have set the channel up. Rewinding the attempt as well as the
          // status means a week of queued confirmations still has all five
          // retries available on the day the credentials land.
          status: notConfigured ? 'queued' : 'failed',
          attempts: notConfigured ? item.attempts : item.attempts + 1,
          last_error: message.slice(0, 500),
        })
        .eq('id', item.id);

      if (notConfigured) summary.skipped += 1;
      else summary.failed += 1;
    }
  }

  return summary;
}
