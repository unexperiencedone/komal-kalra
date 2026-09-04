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
  youtube: 'https://www.youtube.com/@astrologer.komalkalra', // PLACEHOLDER
  youtubeHandle: '@astrologer.komalkalra', // PLACEHOLDER
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

/**
 * How a booking is completed.
 *
 *   'payment'   the built checkout — slot hold, Razorpay order, appointment row
 *   'whatsapp'  details are formatted into a WhatsApp message the visitor sends;
 *               payment and confirmation are arranged in that conversation
 *
 * WHY A SWITCH AND NOT A REWRITE
 *
 * The practice does not have Razorpay or WhatsApp Business API credentials yet,
 * so nothing can be taken online today. That is a temporary fact about the
 * paperwork, not a decision about the product — so the checkout is disabled,
 * not deleted. Turning payments on when the keys arrive is this one variable.
 *
 * NEXT_PUBLIC_ because the booking flow is a client component and has to render
 * a different final step. It is a mode flag, not a secret; nothing about
 * knowing it helps an attacker, and the server still refuses to create an order
 * when Razorpay is unconfigured regardless of what the browser believes.
 *
 * WHAT 'whatsapp' MODE DELIBERATELY DOES NOT DO
 *
 * It writes NOTHING to the database — no lead, no hold, no appointment. So no
 * slot is reserved and two people can ask for the same time. Every label in
 * that mode therefore says "requested", never "booked" or "reserved", and the
 * session is not confirmed until Komal replies. Saying otherwise would be a
 * promise the system cannot keep.
 *
 * One genuine benefit of storing nothing: birth details never reach our
 * database at all, which is the cleanest possible position under the DPDP Act
 * for that category of personal data.
 */
export type BookingMode = 'payment' | 'whatsapp';

export const BOOKING_MODE: BookingMode =
  process.env.NEXT_PUBLIC_BOOKING_MODE === 'whatsapp' ? 'whatsapp' : 'payment';

/**
 * The number booking enquiries go to, digits only — wa.me rejects the `+`.
 *
 * Deliberately the published business number rather than WHATSAPP_ADMIN_TO:
 * that one is a server-side notification target, whereas this is where a client
 * starts a conversation, and it must be a number Komal actually reads and
 * replies from.
 */
export const WHATSAPP_ENQUIRY_NUMBER = BRAND.phonesE164[0].replace(/\D/g, '');

/**
 * Booking policy. Changed from "free cancellation up to 24 hours" to final sale.
 *
 * ⚠️  ONE DISTINCTION RUNS THROUGH ALL OF THIS, AND IT IS NOT COSMETIC.
 *
 *   A CLIENT cannot cancel and cannot obtain a refund for changing their mind.
 *   KOMAL can still refund, and the system must always be able to.
 *
 * Those are different things and the second is not optional. Three cases need
 * it, and none of them is a client changing their mind:
 *
 *   1. Komal cancels, is ill, or otherwise cannot deliver the session. Keeping
 *      money for a service that was never provided is not a strict policy, it
 *      is taking payment for nothing — and under India's Consumer Protection
 *      Act 2019 an "under no circumstances" term is the kind of clause that
 *      gets read as unfair and struck out, taking the enforceable parts of the
 *      policy with it.
 *   2. `confirm_appointment_payment` has a real path where a payment captures
 *      but the slot could not be secured — the appointment lands in
 *      `needs_attention`. That money must be returnable. The comment in
 *      17_functions_payments.sql already commits to this: "We never silently
 *      keep money for a booking that does not exist."
 *   3. The ₹1 live-key verification is refunded after every run.
 *
 * So the admin refund tooling stays. What is removed is the CLIENT's ability
 * to cancel or to reschedule themselves.
 */
export const POLICY = {
  /**
   * Kept at 0 rather than deleted. `services.free_cancellation_hours` is a
   * nullable column that falls back to this, and several call sites read it —
   * removing the key would break them silently, whereas 0 makes every window
   * expression evaluate to "no free window" without any of them changing.
   */
  freeCancellationHours: 0,

  cancellationSummary:
    'Bookings are final. Once a session is paid for it cannot be cancelled and the fee is not refundable.',

  rescheduleSummary:
    'You may move your session once. Call us to arrange it — rescheduling is not self-service, so that a new time can be agreed with Komal directly.',

  /** Shown wherever a refund is genuinely possible — i.e. Komal-side only. */
  refundTiming:
    'Where a refund is due — if Komal has to cancel, or a session cannot go ahead from our side — it returns to your original payment method, usually within 5–7 working days.',

  /** Hard cap. Enforced in the database, not just described here. */
  maxReschedules: 1,
} as const;

export const CURRENCY = 'INR' as const;

/** Routes that must never be indexed — application surface, not content. */
export const NOINDEX_PREFIXES = ['/book', '/dashboard', '/admin', '/login', '/auth'] as const;
