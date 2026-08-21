import 'server-only';
import {
  AstrologyProviderError,
  type AstrologyProvider,
  type BirthChart,
  type BirthInput,
  type GunaMilan,
  type MangalDosha,
  type PanchangDay,
} from './provider';

/**
 * Prokerala implementation.
 *
 * ⚠️  SERVER ONLY. The client secret must never reach the browser. Every call
 * site is a route handler under /api/astrology; nothing here is importable
 * from a client component, which `import 'server-only'` enforces at build time
 * rather than by convention.
 *
 * AUTH is OAuth2 client-credentials: POST the id and secret, get a bearer
 * token with a TTL, use it until it expires. The token is cached in module
 * scope with a safety margin — see `getToken`.
 *
 * COORDINATES, NOT PLACE NAMES. Prokerala wants `lat,lng`. Turning "Kanpur"
 * into coordinates is a separate job, done by ./geocode.ts.
 */

const TOKEN_URL = 'https://api.prokerala.com/token';
const BASE = 'https://api.prokerala.com/v2/astrology';

interface CachedToken {
  value: string;
  /** Epoch ms after which it must not be reused. */
  expiresAt: number;
}
let cachedToken: CachedToken | null = null;

/**
 * A token request is itself a network call, so it is cached — but with a 60s
 * safety margin subtracted from the stated TTL.
 *
 * Without the margin a token that expires in 2s passes the check, gets used,
 * and the request 401s in flight. The margin costs one extra token fetch an
 * hour and removes a whole class of intermittent failure that is miserable to
 * reproduce.
 *
 * Module scope, not a shared cache: tokens are cheap, per-instance is fine,
 * and putting a credential in Postgres to save a request would be a poor
 * trade.
 */
async function getToken(): Promise<string> {
  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AstrologyProviderError(
      'Astrology provider is not configured.',
      'not_configured',
      503,
    );
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    // Do not echo the body: on a credentials failure it can contain the id.
    throw new AstrologyProviderError(
      `Could not authenticate with the astrology provider (${response.status}).`,
      response.status === 401 ? 'not_configured' : 'upstream_error',
    );
  }

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new AstrologyProviderError('Provider returned no access token.', 'upstream_error');
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(0, (json.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken.value;
}

/** ISO 8601 with offset, which is the format Prokerala's `datetime` expects. */
function toIsoWithOffset(date: string, time: string, timezone: string): string {
  // Work out the zone's offset for that instant rather than assuming +05:30 —
  // a hardcoded India offset silently produces the wrong chart for anyone born
  // abroad, and gives no sign that it has.
  const naive = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(naive.getTime())) {
    throw new AstrologyProviderError('Invalid birth date or time.', 'bad_request', 400);
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });
  const part = formatter.formatToParts(naive).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const offset = part.replace('GMT', '') || '+00:00';

  return `${date}T${time}:00${offset}`;
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Caching is ours to do, in Postgres, keyed on the inputs — see ./cache.ts.
    // Next's fetch cache is per-instance and would not survive a cold start.
    cache: 'no-store',
  });

  if (response.status === 429) {
    throw new AstrologyProviderError(
      'The astrology service is busy. Please try again in a moment.',
      'rate_limited',
      429,
    );
  }
  if (response.status === 402 || response.status === 403) {
    // Prokerala answers 402 when the credit balance is spent.
    throw new AstrologyProviderError(
      'The astrology service is temporarily unavailable.',
      'quota_exhausted',
      503,
    );
  }
  if (!response.ok) {
    throw new AstrologyProviderError(
      `Astrology provider error (${response.status}).`,
      'upstream_error',
    );
  }

  const json = await response.json();
  return (json?.data ?? json) as T;
}

/**
 * Prokerala's response shapes are loosely typed here on purpose. The wrapper
 * renames and reshapes fields relative to the underlying API and has changed
 * shape between minor versions; reading defensively with `?.` and mapping into
 * OUR types means a provider-side rename degrades one field to null instead of
 * throwing a TypeError halfway through rendering a page.
 */
type Loose = Record<string, unknown>;
const asArray = (v: unknown): Loose[] => (Array.isArray(v) ? (v as Loose[]) : []);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

export const prokerala: AstrologyProvider = {
  name: 'prokerala',

  async birthChart(input: BirthInput): Promise<BirthChart> {
    const params = {
      datetime: toIsoWithOffset(input.date, input.time, input.timezone),
      coordinates: `${input.latitude},${input.longitude}`,
      ayanamsa: '1', // Lahiri, the Indian government standard.
    };

    const [planets, kundli] = await Promise.all([
      call<Loose>('/planet-position', params),
      call<Loose>('/kundli', params),
    ]);

    const positions = asArray((planets as Loose)?.planet_position).map((p) => ({
      name: str(p.name) ?? 'Unknown',
      sign: str((p.rasi as Loose)?.name) ?? '—',
      degree: num(p.degree) ?? 0,
      house: num(p.position),
      retrograde: p.is_retrograde === true,
    }));

    const nakshatraRaw = (kundli as Loose)?.nakshatra_details as Loose | undefined;

    return {
      planets: positions,
      ascendant: (() => {
        const asc = positions.find((p) => p.name.toLowerCase() === 'ascendant');
        return asc ? { sign: asc.sign, degree: asc.degree } : null;
      })(),
      moonSign: str((nakshatraRaw?.chandra_rasi as Loose)?.name),
      sunSign: str((nakshatraRaw?.soorya_rasi as Loose)?.name),
      nakshatra: nakshatraRaw?.nakshatra
        ? {
            name: str((nakshatraRaw.nakshatra as Loose).name) ?? '—',
            pada: num((nakshatraRaw.nakshatra as Loose).pada),
            lord: str(((nakshatraRaw.nakshatra as Loose).lord as Loose)?.name),
          }
        : null,
    };
  },

  async gunaMilan(bride: BirthInput, groom: BirthInput): Promise<GunaMilan> {
    const data = await call<Loose>('/kundli-matching', {
      girl_dob: toIsoWithOffset(bride.date, bride.time, bride.timezone),
      girl_coordinates: `${bride.latitude},${bride.longitude}`,
      boy_dob: toIsoWithOffset(groom.date, groom.time, groom.timezone),
      boy_coordinates: `${groom.latitude},${groom.longitude}`,
      ayanamsa: '1',
    });

    const match = (data?.guna_milan ?? data) as Loose;

    return {
      obtained: num(match?.total_points) ?? 0,
      maximum: num(match?.maximum_points) ?? 36,
      kootas: asArray(match?.guna).map((g) => ({
        name: str(g.name) ?? '—',
        obtained: num(g.obtained_points) ?? 0,
        maximum: num(g.maximum_points) ?? 0,
        description: str(g.description) ?? undefined,
      })),
      verdict: str((data?.message as Loose)?.description ?? data?.message) ?? undefined,
    };
  },

  async mangalDosha(input: BirthInput): Promise<MangalDosha> {
    const data = await call<Loose>('/mangal-dosha', {
      datetime: toIsoWithOffset(input.date, input.time, input.timezone),
      coordinates: `${input.latitude},${input.longitude}`,
      ayanamsa: '1',
    });

    return {
      present: data?.has_dosha === true,
      severity: str(data?.type),
      description: str(data?.description),
    };
  },

  async panchang(params): Promise<PanchangDay> {
    const data = await call<Loose>('/panchang', {
      datetime: `${params.date}T06:00:00+05:30`,
      coordinates: `${params.latitude},${params.longitude}`,
      ayanamsa: '1',
    });

    const first = (key: string) => str(asArray(data?.[key])[0]?.name);
    const window = (raw: unknown) => {
      const w = asArray(raw)[0];
      const start = str(w?.start);
      const end = str(w?.end);
      return start && end ? { start, end } : null;
    };

    return {
      date: params.date,
      sunrise: str(data?.sunrise),
      sunset: str(data?.sunset),
      tithi: first('tithi'),
      nakshatra: first('nakshatra'),
      yoga: first('yoga'),
      karana: first('karana'),
      rahuKaal: window((data?.muhurat as Loose)?.rahu ?? data?.rahu_kaal),
      abhijitMuhurat: window((data?.muhurat as Loose)?.abhijit ?? data?.abhijit_muhurat),
    };
  },
};

/** True when credentials exist. Tool pages use this to render an honest
 *  "not connected yet" state instead of a broken form. */
export function isAstrologyConfigured(): boolean {
  return Boolean(process.env.PROKERALA_CLIENT_ID && process.env.PROKERALA_CLIENT_SECRET);
}
