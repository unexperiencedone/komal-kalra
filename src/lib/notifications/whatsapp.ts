import 'server-only';
import { BRAND } from '@/lib/config';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { drainOutbox, ChannelNotConfiguredError, type OutboxRow, type DrainSummary } from './worker';
import type { NotificationTemplate } from './outbox';

/**
 * WhatsApp delivery.
 *
 * THE ONE FACT THAT SHAPES THIS WHOLE FILE
 *
 * You cannot send arbitrary text to a WhatsApp user. A business-initiated
 * message — which every booking confirmation is, because the client has not
 * messaged us — must use a TEMPLATE that Meta approved in advance, and the only
 * thing the API sends is the template's name plus an ordered list of variables
 * that fill its placeholders. Free text is possible only inside a 24-hour
 * window opened by the customer writing first.
 *
 * So `renderWhatsApp` returns a template name and positional variables, not a
 * message body. The prose lives in the template registered in WhatsApp Manager;
 * `docs/whatsapp-setup.md` has the exact text to submit, and the ORDER of the
 * variables there must match the order returned here. Change one and you must
 * change the other — a mismatch is not a crash, it is a message that says
 * "confirmed for ₹2,600" where the date should be.
 *
 * `fallbackText` is the same message as plain prose. It is not sent to Meta; it
 * is what a BSP with a free-text endpoint would use, and what gets logged when
 * no provider is configured, so the queue is inspectable before anything is
 * live.
 *
 * PROVIDER-AGNOSTIC BY REQUEST. The practice has not chosen between a BSP
 * (Interakt, AiSensy) and Meta's Cloud API direct. `WhatsAppProvider` is the
 * seam: the Cloud API implementation below is real, and a BSP is a second
 * implementation of the same three-method interface. Nothing outside this file
 * knows which is in use.
 */

/* ========================================================================== */
/*  Message rendering                                                         */
/* ========================================================================== */

export interface WhatsAppMessage {
  /** Template name as registered in WhatsApp Manager. */
  templateName: string;
  /** Positional {{1}}, {{2}}, … values, IN ORDER. */
  variables: string[];
  /** The same content as prose, for logging and free-text-capable providers. */
  fallbackText: string;
}

type Payload = {
  appointment?: {
    name?: string;
    reference?: string;
    service?: string;
    starts_at?: string;
    total_paise?: number;
    meeting_url?: string;
    link?: string;
    contact_phone?: string;
    question?: string;
  };
};

const dash = '—';

function when(startsAt?: string): string {
  if (!startsAt) return dash;
  return `${formatLongDay(startsAt)} at ${formatTime(startsAt)} IST`;
}

/**
 * WhatsApp rejects template variables containing newlines, tabs, or four or
 * more consecutive spaces — the message is accepted by the API and then fails
 * at delivery, which is the worst possible failure mode because nothing looks
 * wrong until a client says they never got it. Flatten defensively; the client
 * question in particular is free text typed into a textarea.
 */
function param(value: string | undefined | null): string {
  if (!value) return dash;
  return value.replace(/\s+/g, ' ').trim().slice(0, 900) || dash;
}

export function renderWhatsApp(
  template: NotificationTemplate,
  payload: Payload,
): WhatsAppMessage | null {
  const a = payload.appointment ?? {};
  const name = param(a.name ?? 'there');
  const service = param(a.service);
  const at = param(when(a.starts_at));
  const reference = param(a.reference);
  const amount = a.total_paise != null ? formatPaise(a.total_paise) : dash;

  /*
   * ⚠️ These three were temporarily collapsed to Meta's stock `hello_world`
   * template to smoke-test the connection. That has been undone, because
   * shipping it would have sent every client the literal words "Hello world"
   * instead of their booking — and it would have looked like a working
   * integration the whole time, since Meta returns 200 for it.
   *
   * To smoke-test again, use the curl command in docs/whatsapp-setup.md. It
   * exercises the same credentials and the same endpoint WITHOUT routing real
   * confirmations through a placeholder template.
   */
  switch (template) {
    case 'booking_confirmed':
      return {
        templateName: 'booking_confirmed_client',
        variables: [name, service, at, reference, amount, param(a.link)],
        fallbackText:
          `Namaste ${name}, your consultation with ${BRAND.fullName} is confirmed.\n\n` +
          `Service: ${service}\nWhen: ${at}\nReference: ${reference}\nPaid: ${amount}\n\n` +
          `Your booking: ${param(a.link)}\n\n` +
          `Astrologer Komal Kalra will send the joining link before your session.`,
      };

    /**
     * Komal's own copy. A separate template rather than the client one sent
     * twice: she needs the client's NAME and NUMBER, and the client must never
     * receive a message containing their own details phrased as somebody else's.
     */
    case 'booking_alert_admin':
      return {
        templateName: 'booking_alert_admin',
        variables: [name, service, at, reference, param(a.contact_phone), param(a.question)],
        fallbackText:
          `New booking.\n\n` +
          `Client: ${name}\nService: ${service}\nWhen: ${at}\n` +
          `Reference: ${reference}\nPhone: ${param(a.contact_phone)}\n` +
          `Wants to discuss: ${param(a.question)}`,
      };

    case 'appointment_reminder':
      return {
        templateName: 'appointment_reminder',
        variables: [name, service, at, param(a.link)],
        fallbackText:
          `Namaste ${name}, a reminder that your ${service} with ${BRAND.fullName} ` +
          `is ${at}.\n\nDetails: ${param(a.link)}`,
      };

    /**
     * Komal's own reminder, 24 hours out.
     *
     * Again a separate template, and for a reason beyond phrasing: the client's
     * reminder is addressed to them and carries a link to THEIR booking page.
     * Sending Komal that same message would give her a reminder about her own
     * appointment written as though she were the client, and a link that opens
     * one client's booking rather than her day. This one names the client and
     * their number, so she can call ahead if she needs to.
     */
    case 'appointment_reminder_admin':
      return {
        templateName: 'appointment_reminder_admin',
        // ORDER: service, name, when, phone — matching
        // "Reminder: {{1}} with {{2}} is {{3}}" in docs/whatsapp-setup.md.
        // Meta numbers placeholders sequentially, so the reading order of the
        // sentence dictates this array. Swapping the first two here would send
        // "Reminder: Simran with Astrological Guidance", which is accepted by
        // the API and merely reads as nonsense to Komal.
        variables: [service, name, at, param(a.contact_phone)],
        fallbackText:
          `Reminder: ${service} with ${name} is ${at}.\n` +
          `Their number: ${param(a.contact_phone)}`,
      };

    /**
     * Everything else stays on email deliberately.
     *
     * Refund notices, payment failures and cancellations are the messages a
     * person may need to forward to a bank or quote months later, and they read
     * badly compressed into an approved template with six placeholders. There
     * is also no reason to pay per message, and wait on template approval, for
     * something email already does better.
     */
    default:
      return null;
  }
}

/* ========================================================================== */
/*  Phone numbers                                                             */
/* ========================================================================== */

/**
 * To E.164, assuming India when no country code is present.
 *
 * The assumption is stated rather than hidden because it is a real limitation:
 * a client abroad who types a bare 10-digit local number will be normalised to
 * an Indian one and will not receive the message. That is the correct trade for
 * this practice — the clientele is overwhelmingly Indian and the alternative,
 * refusing anything without a country code, would reject the format almost
 * every Indian client types. The email confirmation goes out regardless, so a
 * mis-parsed number degrades to "email only", not to silence.
 *
 * Returns null rather than guessing when the digits do not fit a shape we
 * recognise. Sending to a number we invented is worse than not sending.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hasPlus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+91${digits}`;              // 9812345678
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  return null;
}

/* ========================================================================== */
/*  Providers                                                                 */
/* ========================================================================== */

export interface WhatsAppProvider {
  readonly name: string;
  /**
   * Returns the provider's message id where it has one.
   *
   * This is not bookkeeping. Delivery receipts arrive keyed on this id and
   * nothing else, so a send that discards it can never be told apart from one
   * that silently failed to arrive — see database/30_whatsapp_delivery.sql.
   */
  send(to: string, message: WhatsAppMessage): Promise<string | null>;
}

/**
 * Meta Cloud API, direct.
 *
 * ⚠️ WRITTEN FROM THE DOCUMENTED REQUEST SHAPE. Exercise it against the test
 * number with the curl command in docs/whatsapp-setup.md before going live —
 * and note that a 200 here means ACCEPTED, not delivered. Only the webhook can
 * tell you a message actually arrived.
 */
class MetaCloudProvider implements WhatsAppProvider {
  readonly name = 'meta-cloud';

  constructor(
    private readonly phoneNumberId: string,
    private readonly accessToken: string,
    private readonly lang: string,
  ) {}

  async send(to: string, message: WhatsAppMessage): Promise<string | null> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: message.templateName,
            language: { code: this.lang },
            components: [
              {
                type: 'body',
                parameters: message.variables.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        }),
        // Without this a hung provider holds the cron invocation open until the
        // platform kills it, and every queued message behind it waits.
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // The message deliberately includes the provider's own error text: Meta's
      // template errors ("template name does not exist in en") are the single
      // most common failure here and are useless once flattened to "400".
      throw new Error(`whatsapp_send_failed ${response.status}: ${body.slice(0, 300)}`);
    }

    // { messages: [{ id: "wamid.HBg..." }] }
    //
    // A parse failure here is NOT a send failure — Meta already accepted the
    // message, and throwing would make the worker send it again. Lose the id,
    // keep the message: the cost is a receipt we cannot match, not a duplicate.
    try {
      const json = (await response.json()) as { messages?: { id?: string }[] };
      return json.messages?.[0]?.id ?? null;
    } catch {
      console.warn('[whatsapp] sent but could not read the message id');
      return null;
    }
  }
}

/**
 * The default. Configured with nothing, sends nothing, and says so.
 *
 * It throws ChannelNotConfiguredError rather than resolving, so the outbox row
 * stays queued instead of being marked sent. A "sent" row for a message that
 * never left is the exact class of comfortable lie the brief rules out — and it
 * would be discovered by a client saying they got nothing, weeks later.
 */
class UnconfiguredProvider implements WhatsAppProvider {
  readonly name = 'none';

  async send(to: string, message: WhatsAppMessage): Promise<string | null> {
    console.info(
      `[whatsapp] not configured — holding message to ${to}\n` +
      `  template: ${message.templateName}\n` +
      `  ${message.fallbackText.replace(/\n/g, '\n  ')}`,
    );
    throw new ChannelNotConfiguredError('whatsapp');
  }
}

let provider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (provider) return provider;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  provider =
    process.env.WHATSAPP_PROVIDER === 'meta' && phoneNumberId && accessToken
      ? new MetaCloudProvider(phoneNumberId, accessToken, process.env.WHATSAPP_TEMPLATE_LANG || 'en')
      : new UnconfiguredProvider();

  return provider;
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppProvider().name !== 'none';
}

/**
 * Where Komal's own copy of each booking goes.
 *
 * Separate from BRAND.phones because the number a practice publishes for calls
 * is often not the one running WhatsApp Business — and silently messaging the
 * published landline would look, from the outside, exactly like the feature
 * working. Falls back to the published number only if nothing is set.
 */
export function adminWhatsAppNumber(): string | null {
  return toE164(process.env.WHATSAPP_ADMIN_TO ?? BRAND.phonesE164[0] ?? null);
}

/* ========================================================================== */
/*  Worker                                                                    */
/* ========================================================================== */

export async function processWhatsAppOutbox(batchSize = 25): Promise<DrainSummary> {
  const wa = getWhatsAppProvider();

  return drainOutbox('whatsapp', async (row: OutboxRow) => {
    const message = renderWhatsApp(row.template as NotificationTemplate, row.payload as Payload);

    // No WhatsApp form of this template. Not a failure — email covers it.
    if (!message) throw new Error(`no_whatsapp_template_for_${row.template}`);

    const to = toE164(row.recipient);
    if (!to) throw new Error(`unusable_number_${row.recipient.slice(0, 6)}`);

    return wa.send(to, message);
  }, batchSize);
}
