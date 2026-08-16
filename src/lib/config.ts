/**
 * Business constants. Safe to import from client components — nothing secret.
 */

/**
 * ⚠️ `name` and `fullName` MUST stay identical, and MUST match the "App name"
 * field on the Google Cloud OAuth consent screen character for character.
 *
 * They used to differ — the wordmark said "Komal Kalra" while <title>,
 * og:site_name and the schema.org Person all said "Astrologer Komal Kalra".
 * Google's OAuth verification review rejected the app for exactly that:
 *
 *   "The app name 'Komal Kalra' configured for your OAuth consent screen
 *    does not match the app name on your homepage."
 *
 * A reviewer reads the homepage and compares one string. Two plausible names
 * on one page is enough to fail. Both keys are kept only so existing call
 * sites do not have to change; there is one name, and this is it.
 */
export const BRAND = {
  name: 'Astrologer Komal Kalra',
  fullName: 'Astrologer Komal Kalra',
  tagline: 'Find clarity. Choose your direction. Move forward with confidence.',
  phones: ['+91 98785 77077', '+91 91151 77077'],
  /** E.164, for tel: and wa.me links */
  phonesE164: ['+919878577077', '+919115177077'],
  instagram: 'https://www.instagram.com/astrologer.komalkalra',
  instagramHandle: '@astrologer.komalkalra',
  email: 'consult@komalkalra.com', // PLACEHOLDER — replace with the real address
} as const;

/**
 * All slot arithmetic happens in this zone. Stored values are timestamptz, so
 * this only affects how wall-clock working hours are interpreted and rendered.
 */
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export const BOOKING = {
  /**
   * How long a slot stays reserved while the visitor completes checkout.
   * Chosen as comfortably longer than a Razorpay Checkout session (typically
   * 2–4 minutes including UPI/OTP) but short enough that an abandoned hold does
   * not block the calendar. See docs/research.md §5.3.
   */
  holdTtlMinutes: 10,
  /** Warn the user when the hold has this long left. */
  holdWarningSeconds: 120,
  /** How far ahead the calendar renders by default. */
  defaultWindowDays: 21,
} as const;

export const POLICY = {
  /** Free cancellation window, unless a service overrides it. */
  freeCancellationHours: 24,
  cancellationSummary:
    'Free cancellation up to 24 hours before your session, with a full refund. Within 24 hours, the session fee is non-refundable but you may reschedule once at no cost.',
  rescheduleSummary:
    'You can reschedule once, free of charge, up to 12 hours before your session.',
  refundTiming: 'Refunds return to your original payment method, usually within 5–7 working days.',
} as const;

export const CURRENCY = 'INR' as const;

/** Routes that must never be indexed — application surface, not content. */
export const NOINDEX_PREFIXES = ['/book', '/dashboard', '/admin', '/login', '/auth'] as const;
