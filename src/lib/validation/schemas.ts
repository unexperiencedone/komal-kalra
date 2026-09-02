import { z } from 'zod';

/**
 * The single source of truth for input shapes.
 *
 * Every schema here is used on BOTH sides: React Hook Form validates against it
 * for immediate feedback, and the server re-validates the same schema before
 * touching the database. Client validation is a convenience; the server call is
 * the one that counts, and it never trusts that the client ran first.
 */

/** Indian mobile numbers, with or without +91. Deliberately permissive on spacing. */
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Enter a valid phone number')
  .max(20, 'That phone number looks too long')
  .regex(/^(\+?91[\s-]?)?[6-9]\d{9}$|^\+?[0-9\s-]{8,18}$/, 'Enter a valid phone number');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your name')
  .max(80, 'That name is too long');

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});

export const signUpSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  // 8 minimum matches Supabase's default policy. Length beats composition rules:
  // forced symbols push people toward predictable substitutions.
  password: z.string().min(8, 'Use at least 8 characters'),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
export const createHoldSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
});

/**
 * Birth details. All optional — a consultation can proceed without them, and
 * demanding an exact birth time from someone who does not know it is a real
 * abandonment cause. `birthTimeKnown: false` is a first-class answer.
 */
export const birthDetailsSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date of birth'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM').optional().or(z.literal('')),
  birthCity: z.string().trim().min(1, 'Please enter your birth city').max(120),
  birthState: z.string().trim().min(1, 'Please enter your birth state').max(120),
  birthCountry: z.string().trim().min(1, 'Please enter your birth country').max(120),
  // NOTE: no .default() here. z.default() makes the schema's input type
  // differ from its output type, which breaks the React Hook Form resolver
  // generic. The form always supplies this field, so a default earns nothing.
  birthTimeKnown: z.boolean(),
}).refine(data => !data.birthTimeKnown || data.birthTime, {
  message: 'Please enter your time of birth',
  path: ['birthTime'],
});

export const bookingDetailsSchema = birthDetailsSchema.extend({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  acceptTerms: z.literal(true, { message: 'Please accept the terms to continue' }),
});

export const createOrderSchema = z.object({
  holdId: z.string().uuid(),
  serviceId: z.string().uuid(),
  details: bookingDetailsSchema,
});

/**
 * The Razorpay Checkout handler payload.
 *
 * NOTE: these three values arrive from the BROWSER and are therefore untrusted.
 * Passing this schema means the shape is right; it says nothing about
 * authenticity. Authenticity comes only from the HMAC check in
 * `verifyCheckoutSignature()`. See docs/research.md §4.1.
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(16),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const rescheduleRequestSchema = z.object({
  appointmentId: z.string().uuid(),
  preferred: z.string().trim().max(300).optional(),
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
  serviceId: z.string().uuid().optional().or(z.literal('')),
  /** Honeypot. Real users never fill a hidden field; bots fill everything. */
  website: z.string().max(0).optional(),
}).refine((v) => Boolean(v.email || v.phone), {
  message: 'Please leave either an email address or a phone number',
  path: ['email'],
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  birthPlace: z.string().trim().max(120).optional().or(z.literal('')),
  birthTimeKnown: z.boolean(),
  marketingOptIn: z.boolean(),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const serviceFormSchema = z.object({
  title: z.string().trim().min(3).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only'),
  tagline: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().min(20).max(4000),
  // Entered in rupees for human sanity, converted to paise before it touches
  // the database. This is the ONLY place a rupee number is accepted as input.
  priceRupees: z.coerce.number().int().min(0).max(1_000_000),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  mode: z.enum(['video', 'phone', 'in_person']),
  minNoticeHours: z.coerce.number().int().min(0).max(720),
  // The earliest bookable date is today + this many days. 3 is the practice's
  // "two clear days" rule. See database/28_min_lead_days.sql for why it is not
  // stored as 2.
  minLeadDays: z.coerce.number().int().min(0).max(365),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  active: z.boolean(),
  bookableOnline: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

/**
 * Refunds. `amountRupees` omitted means a FULL refund — matching Razorpay's own
 * API semantics, where omitting `amount` refunds everything.
 */
export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amountRupees: z.coerce.number().positive().optional(),
  reason: z.string().trim().min(3, 'A reason is required for the audit log').max(300),
});

export const availabilityRuleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotIntervalMinutes: z.coerce.number().int().min(5).max(240),
  label: z.string().trim().max(40).optional().or(z.literal('')),
  active: z.boolean(),
}).refine((v) => v.endTime > v.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const availabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  available: z.boolean(),
  reason: z.string().trim().max(160).optional().or(z.literal('')),
});

export const leadUpdateSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'closed']).optional(),
  assignedNote: z.string().trim().max(1000).optional(),
  followUpAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const appointmentNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  body: z.string().trim().min(1).max(8000),
  followUpAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type BookingDetailsInput = z.infer<typeof bookingDetailsSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
export type RefundInput = z.infer<typeof refundSchema>;

/**
 * A client's review of a completed session.
 *
 * The 20-character floor mirrors the CHECK constraint on `testimonials.review`
 * — validating in one place only means either the form accepts something the
 * database rejects (an unexplained failure) or the database accepts something
 * the form would not.
 *
 * `displayInitialsOnly` exists because astrological consultations are private
 * for a lot of people. Someone may be glad to recommend Komal and still not
 * want their full name beside a review of a session about their marriage. The
 * default is the cautious one.
 */
export const testimonialSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, 'Please choose a rating.').max(5),
  review: z
    .string()
    .trim()
    .min(20, 'Please write at least a sentence or two.')
    .max(1500, 'Please keep it under 1500 characters.'),
  authorName: z.string().trim().min(1, 'Please enter the name to show.').max(120),
  authorLocation: z.string().trim().max(120).optional().or(z.literal('')),
  displayInitialsOnly: z.boolean().default(false),
});
