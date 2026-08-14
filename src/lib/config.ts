/**
 * Business constants. Safe to import from client components — nothing secret.
 */

export const BRAND = {
  name: 'Komal Kalra',
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
