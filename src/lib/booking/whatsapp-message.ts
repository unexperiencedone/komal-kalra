import { WHATSAPP_ENQUIRY_NUMBER } from '@/lib/config';

/**
 * Turns a filled-in booking form into a WhatsApp message the visitor sends.
 *
 * NO API, NO CREDENTIALS, NO APPROVAL. `wa.me` is a plain deep link — it opens
 * WhatsApp with text pre-typed in the compose box. That is why this works today
 * while the Business API paperwork is outstanding, and it is also its one
 * limitation, spelled out below.
 *
 * ⚠️  OPENING WHATSAPP IS NOT SENDING.
 *
 * The link fills the compose box and stops. The visitor must still press send,
 * and nothing on our side can know whether they did — there is no callback, no
 * receipt, no way to detect it. A UI that says "booking sent!" after the click
 * would be stating something it cannot observe, and the person it misleads is
 * the one who then waits for a reply that is never coming because their message
 * was never sent. The flow says "now press send in WhatsApp" instead.
 *
 * FORMAT NOTES
 *
 * Plain text, short lines, no markdown tables — this is read on a phone, in a
 * chat bubble, usually one-handed. Labels are front-loaded so Komal can scan a
 * dozen of these quickly. Empty fields are omitted entirely rather than printed
 * as "Birth time: —", which is noise in a message she has to read, however
 * useful it is in a database row.
 */

export interface BookingEnquiry {
  fullName: string;
  email: string;
  phone: string;
  serviceTitle: string;
  /** Human-readable requested slot, already formatted in IST. Optional. */
  requestedAt?: string | null;
  birthDate?: string;
  birthTime?: string;
  birthTimeKnown?: boolean;
  birthPlace?: string;
  question?: string;
}

/** One "Label: value" line, or nothing at all when there is no value. */
function line(label: string, value?: string | null): string {
  const v = (value ?? '').trim();
  return v ? `${label}: ${v}\n` : '';
}

export function buildEnquiryMessage(e: BookingEnquiry): string {
  let m = 'Hello, I would like to book a consultation.\n\n';

  m += line('Service', e.serviceTitle);
  m += line('Preferred time', e.requestedAt);

  m += '\n';
  m += line('Name', e.fullName);
  m += line('Phone', e.phone);
  m += line('Email', e.email);

  const birth =
    line('Date of birth', e.birthDate) +
    // An unknown birth time is stated, not omitted. Blank would read as "they
    // forgot"; "not known" tells Komal which techniques are available to her
    // before she opens the chart, which is a real difference in her prep.
    line('Time of birth', e.birthTimeKnown === false ? 'Not known' : e.birthTime) +
    line('Place of birth', e.birthPlace);

  if (birth) m += `\n${birth}`;

  if (e.question?.trim()) {
    m += `\nWhat I would like to discuss:\n${e.question.trim()}\n`;
  }

  return m.trimEnd();
}

/**
 * The deep link.
 *
 * `wa.me` rather than `api.whatsapp.com`: it is the officially documented click-
 * to-chat host, and it resolves correctly to the app on mobile and to WhatsApp
 * Web on desktop without us sniffing the platform.
 */
export function enquiryLink(message: string): string {
  return `https://wa.me/${WHATSAPP_ENQUIRY_NUMBER}?text=${encodeURIComponent(message)}`;
}
