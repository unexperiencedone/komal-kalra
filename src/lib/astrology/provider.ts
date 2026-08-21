import 'server-only';

/**
 * The astrology data provider, behind an interface.
 *
 * Mirrors `src/lib/payments/provider.ts` on purpose — same reason, too. The
 * vendor here is a commodity: several suppliers compute the same Vedic values
 * from the same ephemeris, and the one we start on is chosen for price and
 * region rather than because anything depends on it. Keeping the call sites
 * behind an interface means swapping supplier is a new file, not a refactor of
 * every tool page.
 *
 * It also makes the free tools testable without a network or a key: a fake
 * implementing this interface is a few lines.
 */

export interface BirthInput {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** 24-hour `HH:MM`. */
  time: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. `Asia/Kolkata`. */
  timezone: string;
}

export interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  house: number | null;
  retrograde: boolean;
}

export interface BirthChart {
  planets: PlanetPosition[];
  ascendant: { sign: string; degree: number } | null;
  moonSign: string | null;
  sunSign: string | null;
  nakshatra: { name: string; pada: number | null; lord: string | null } | null;
}

export interface GunaMilan {
  /** Points obtained, out of `maximum` (36 in Ashtakoot). */
  obtained: number;
  maximum: number;
  /** Each of the eight kootas, so the total can be explained rather than asserted. */
  kootas: { name: string; obtained: number; maximum: number; description?: string }[];
  /** Provider's own summary, when it gives one. */
  verdict?: string;
}

export interface PanchangDay {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  tithi: string | null;
  nakshatra: string | null;
  yoga: string | null;
  karana: string | null;
  /** Inauspicious window. */
  rahuKaal: { start: string; end: string } | null;
  /** Auspicious window. */
  abhijitMuhurat: { start: string; end: string } | null;
}

export interface MangalDosha {
  present: boolean;
  /** Some providers grade it; null when not supplied. */
  severity: string | null;
  description: string | null;
}

/**
 * Every method may throw `AstrologyProviderError`. Nothing here returns a
 * partial result silently — a tool that shows half an answer with no
 * indication is worse than one that says it could not reach the provider.
 */
export interface AstrologyProvider {
  readonly name: string;
  birthChart(input: BirthInput): Promise<BirthChart>;
  gunaMilan(bride: BirthInput, groom: BirthInput): Promise<GunaMilan>;
  mangalDosha(input: BirthInput): Promise<MangalDosha>;
  panchang(params: { date: string; latitude: number; longitude: number; timezone: string }): Promise<PanchangDay>;
}

export class AstrologyProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_configured'
      | 'rate_limited'
      | 'quota_exhausted'
      | 'upstream_error'
      | 'bad_request',
    readonly status = 502,
  ) {
    super(message);
    this.name = 'AstrologyProviderError';
  }
}
