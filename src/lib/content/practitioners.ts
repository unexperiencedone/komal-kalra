import { BRAND } from '@/lib/config';
import { SUNIL } from './sunil';
import type { ImageKey } from './imagery';
import { CONSULTATION_PACKAGES } from './packages';

/**
 * Who takes a given consultation.
 *
 * TWO ASTROLOGERS PRACTISE HERE, AND THE SITE USED TO SHOW ONLY ONE.
 *
 * The booking summary hardcoded Komal's portrait, name and role for every
 * service. That was harmless while the catalogue was five of her own topic
 * sessions; it stopped being harmless when database/36_consultation_catalogue
 * .sql published the real fee sheet, because the ₹2,100 thirty-minute session
 * is Astrologer Sunil Sharma's. Someone booking him saw her face, her name and
 * "Vedic Astrologer" on the panel that tells them what they are committing to.
 *
 * WHY THE MAP IS DERIVED FROM CONSULTATION_PACKAGES
 *
 * packages.ts already records who takes each session — it is on the published
 * fee sheet, which is where that fact is decided. Writing it out a second time
 * here would create two lists that agree until the day they do not, and the
 * day they do not is the day a client is quoted one astrologer and booked with
 * the other. So this reads the fee sheet rather than restating it: change the
 * `astrologer` on a package and the booking panel, the service page and the
 * consultation picker all follow.
 *
 * A service with no entry — one added in the admin console, or a retired slug
 * reached through an old link — falls back to Komal, who runs the practice.
 * Falling back is right here: a missing portrait on a booking panel reads as a
 * broken page, and the practice's own name is never the wrong answer to "who
 * am I booking with".
 */
export type Practitioner = {
  name: string;
  /** The line under the name on the booking summary. */
  role: string;
  portrait: ImageKey;
};

export const KOMAL: Practitioner = {
  name: BRAND.fullName,
  role: 'Vedic Astrologer',
  portrait: 'komalKalra',
};

export const SUNIL_SHARMA: Practitioner = {
  name: SUNIL.name,
  role: SUNIL.role,
  portrait: 'sunilSharma',
};

const BY_NAME: Record<string, Practitioner> = {
  [KOMAL.name]: KOMAL,
  [SUNIL_SHARMA.name]: SUNIL_SHARMA,
};

/**
 * slug → practitioner, built once from the fee sheet at module load.
 *
 * Packages whose `astrologer` is not one of the two above are skipped rather
 * than guessed at, so a third astrologer added to the fee sheet without a
 * portrait here falls back to Komal instead of rendering a broken image.
 */
const SERVICE_PRACTITIONER: Record<string, Practitioner> = Object.fromEntries(
  CONSULTATION_PACKAGES.flatMap((pkg) => {
    const person = BY_NAME[pkg.astrologer];
    return person ? [[pkg.slug, person] as const] : [];
  }),
);

export function servicePractitioner(slug: string | null | undefined): Practitioner {
  return (slug ? SERVICE_PRACTITIONER[slug] : undefined) ?? KOMAL;
}

/**
 * The audience line for a consultation — "For one person", "Four members".
 *
 * Read from the same fee sheet, for the same reason. The booking picker uses
 * it in place of a duration on the family pack: that package states no session
 * length (see packages.ts), so printing one on the card people choose from
 * would be quoting a commitment the practice has not made. What a buyer needs
 * to know at that moment is that the fee covers four people, not one.
 */
export function serviceAudience(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return CONSULTATION_PACKAGES.find((pkg) => pkg.slug === slug)?.audience ?? null;
}

/**
 * Whether the fee sheet states a session length for this consultation.
 *
 * `false` for the family pack only. The services row carries a duration
 * because the slot engine schedules against one and the column is NOT NULL —
 * that number is for the calendar, not for the client. See
 * database/36_consultation_catalogue.sql.
 */
export function hasStatedDuration(slug: string | null | undefined): boolean {
  if (!slug) return true;
  const pkg = CONSULTATION_PACKAGES.find((p) => p.slug === slug);
  // Unknown slugs (admin-created services) state their duration normally.
  return pkg ? pkg.durationMinutes !== null : true;
}
