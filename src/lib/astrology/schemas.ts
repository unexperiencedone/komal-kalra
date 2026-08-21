import { z } from 'zod';

/**
 * Validation for the free tools.
 *
 * Shared between the route handlers and the client, so the browser and the
 * server agree on what a valid submission is. The SERVER is the one that
 * decides — the client copy exists to give fast feedback, not to be trusted.
 */

/** A place already resolved to coordinates, as returned by /api/astrology/places. */
export const placeSchema = z.object({
  label: z.string().min(1).max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1).max(64),
});

export const birthSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.')
    .refine((value) => {
      const d = new Date(`${value}T00:00:00Z`);
      // Reject impossible dates that still match the pattern ('2024-02-31'),
      // and anything in the future — nobody has a birth chart for next year.
      return !Number.isNaN(d.getTime()) && d.getUTCDate() === Number(value.slice(-2)) && d <= new Date();
    }, 'Enter a real date in the past.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use the time picker.'),
  place: placeSchema,
});

export type BirthPayload = z.infer<typeof birthSchema>;

/**
 * Contact details captured alongside a tool run.
 *
 * PHONE IS OPTIONAL, deliberately. The reference site requires it before
 * returning anything, which measurably suppresses completion; an email address
 * is enough to follow up and the tool's job is to be used.
 *
 * `consent` is `literal(true)`, so the SERVER rejects a submission without it.
 * A disabled button is a courtesy; this is the actual control, and it is what
 * makes the consent claim in the privacy policy true rather than aspirational.
 */
export const toolLeadSchema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(160),
  phone: z.string().trim().max(24).optional().or(z.literal('')),
  consent: z.literal(true, { message: 'Please accept the privacy policy to continue.' }),
  /** Honeypot. Bots fill every field; humans never see this one. */
  website: z.string().max(0).optional(),
});

export const kundliRequestSchema = birthSchema.extend({ lead: toolLeadSchema });

export const matchingRequestSchema = z.object({
  bride: birthSchema,
  groom: birthSchema,
  lead: toolLeadSchema,
});

export const panchangRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: placeSchema,
});
