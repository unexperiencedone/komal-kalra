import { BRAND } from '@/lib/config';
import { SUNIL } from './sunil';

/**
 * The published consultation packages.
 *
 * WHY THIS IS CODE AND NOT A `services` ROW
 *
 * `services.price_paise` is the figure the booking flow holds a slot against
 * and the figure Razorpay would be asked to charge. These five packages are a
 * published FEE LIST — what a visitor is quoted before any conversation
 * starts. Payment is currently arranged over WhatsApp (BOOKING_MODE), so the
 * two are not the same number and must not be forced to be: editing the
 * catalogue to display a rate would silently reprice checkout the day the
 * Razorpay keys arrive.
 *
 * So this is display content, it lives beside the other content modules, and
 * nothing in src/lib/booking or src/lib/payments imports it.
 *
 * WHY IT DOES NOT GO THROUGH publicPrice()
 *
 * SHOW_PRICES defaults to hidden, and that default is right for the catalogue:
 * it guards against a stale or test figure in the DATABASE reaching a public
 * page, which has happened here before (see database/tools/audit-live-
 * catalogue.sql — a real consultation was live at ₹1). These figures are not
 * database state. They are a fee list written down deliberately, reviewed in
 * a diff, and published on purpose — there is no unattended value for the flag
 * to protect against, and hiding them would leave the section empty.
 *
 * PRICES ARE PAISE, like every other monetary value in this codebase.
 * See src/lib/money.ts.
 */
export type ConsultationPackage = {
  id: string;
  /** Who takes the session — two astrologers practise here. */
  astrologer: string;
  /** Card heading, in the fee sheet's own wording. */
  name: string;
  pricePaise: number;
  /** `null` where the sheet states no duration, rather than a guessed one. */
  durationMinutes: number | null;
  /** `null` where the sheet states no format. */
  mode: 'phone' | 'video' | null;
  /** Who the fee covers. */
  audience: string;
  /** Everything the sheet lists beyond duration, format and audience. */
  inclusions: string[];
};

/**
 * Order is the fee sheet's own order — ascending by price, Sunil's session
 * first. Not sorted at render time: the sequence is an editorial decision and
 * belongs where it can be read and changed.
 */
export const CONSULTATION_PACKAGES: readonly ConsultationPackage[] = [
  {
    id: 'sunil-30-minute',
    astrologer: SUNIL.name,
    name: '30-minute consultation',
    pricePaise: 210000,
    durationMinutes: 30,
    mode: 'phone',
    audience: 'For one person',
    inclusions: [],
  },
  {
    id: 'komal-25-minute',
    astrologer: BRAND.fullName,
    name: '25-minute consultation',
    pricePaise: 310000,
    durationMinutes: 25,
    mode: 'phone',
    audience: 'For one person',
    inclusions: [],
  },
  {
    id: 'komal-40-minute',
    astrologer: BRAND.fullName,
    name: '40-minute consultation',
    pricePaise: 510000,
    durationMinutes: 40,
    mode: 'phone',
    audience: 'For one person',
    inclusions: [],
  },
  {
    id: 'komal-in-depth-kundli',
    astrologer: BRAND.fullName,
    name: 'In-depth Kundli consultation',
    pricePaise: 1100000,
    durationMinutes: 60,
    mode: 'video',
    audience: 'For one person',
    inclusions: ['Live prediction on screen', 'Kundli PDF included'],
  },
  {
    id: 'komal-family-pack',
    astrologer: BRAND.fullName,
    name: 'Family pack',
    pricePaise: 2100000,
    // The fee sheet gives no session length for the family pack. Left null so
    // the card prints no duration at all rather than an invented one.
    durationMinutes: null,
    mode: null,
    audience: 'Four members',
    inclusions: ['Individual Kundli analysis for each member', 'Kundli PDF included'],
  },
];
