import { BUSINESS_TIMEZONE } from './config';

/**
 * Date formatting, always rendered in the business timezone.
 *
 * Everything is stored as timestamptz. Rendering in a fixed zone means the
 * practitioner and a client in Dubai see the same appointment time described
 * the same way, which is what people expect from a booking confirmation.
 */

const tz = BUSINESS_TIMEZONE;

function fmt(opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: tz, ...opts });
}

const timeFmt = fmt({ hour: 'numeric', minute: '2-digit', hour12: true });
const dayFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const longDayFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDateFmt = fmt({ day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = fmt({
  day: '2-digit', month: 'short', year: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: true,
});

export const toDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));

export const formatTime = (v: string | Date) => timeFmt.format(toDate(v));
export const formatDay = (v: string | Date) => dayFmt.format(toDate(v));
export const formatLongDay = (v: string | Date) => longDayFmt.format(toDate(v));
export const formatDate = (v: string | Date) => shortDateFmt.format(toDate(v));
export const formatDateTime = (v: string | Date) => dateTimeFmt.format(toDate(v));

/** "Tue, 12 Aug · 4:00 PM – 4:45 PM" */
export function formatSlotRange(start: string | Date, end: string | Date): string {
  return `${formatDay(start)} · ${formatTime(start)} – ${formatTime(end)}`;
}

/** ISO calendar date (YYYY-MM-DD) *in the business timezone*, not UTC. */
export function businessDateKey(v: string | Date): string {
  const d = toDate(v);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(v: Date, days: number): Date {
  const d = new Date(v);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDayUTC(v: Date): Date {
  const d = new Date(v);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** "in 3 days" / "2 hours ago" — used in admin activity feeds. */
export function relativeTime(v: string | Date): string {
  const diffMs = toDate(v).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000], ['month', 2_592_000_000], ['week', 604_800_000],
    ['day', 86_400_000], ['hour', 3_600_000], ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return 'just now';
}

export function hoursUntil(v: string | Date): number {
  return (toDate(v).getTime() - Date.now()) / 3_600_000;
}

export function isPast(v: string | Date): boolean {
  return toDate(v).getTime() < Date.now();
}
