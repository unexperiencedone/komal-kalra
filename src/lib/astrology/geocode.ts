import 'server-only';
import { AstrologyProviderError } from './provider';

/**
 * Turn a place name into coordinates and a timezone.
 *
 * WHY A SECOND SERVICE AT ALL
 *
 * Prokerala takes `lat,lng`, not "Kanpur". Visitors know the name of the town
 * they were born in and essentially never know its coordinates, so something
 * has to bridge the two.
 *
 * WHY OPEN-METEO
 *
 * Its geocoding endpoint needs NO API KEY and no account, is free for
 * non-commercial and commercial use alike, and returns the IANA timezone
 * alongside the coordinates — which matters more than it sounds. Birth time is
 * meaningless without the zone it was recorded in, and a chart computed with
 * the wrong offset is wrong in a way that looks completely plausible.
 *
 * The alternative was Google Geocoding, which is accurate but needs a billing
 * account and a second key to protect. For turning town names into a lat/lng
 * that will be rounded anyway, that is a poor trade.
 *
 * ACCURACY NOTE, worth being honest about: this resolves to a town centroid.
 * For astrology that is fine — a few kilometres moves the ascendant by a small
 * fraction of a degree — but it is not a street address lookup and should not
 * be sold as one.
 */

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export interface Place {
  name: string;
  /** "Kanpur, Uttar Pradesh, India" — shown back so the user can confirm. */
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string | null;
}

interface OpenMeteoResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  admin1?: string;
}

/**
 * Returns several matches rather than one. "Springfield" and "Hyderabad" are
 * real places in more than one country, and silently picking the first is how
 * a tool confidently returns the wrong chart. The UI shows the list and asks.
 */
export async function searchPlaces(query: string, limit = 5): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', String(limit));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  let response: Response;
  try {
    response = await fetch(url, {
      // Place coordinates do not change. A long revalidate keeps repeat
      // lookups off the network entirely.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
  } catch {
    throw new AstrologyProviderError('Could not reach the place lookup service.', 'upstream_error');
  }

  if (!response.ok) {
    throw new AstrologyProviderError(
      `Place lookup failed (${response.status}).`,
      'upstream_error',
    );
  }

  const json = (await response.json()) as { results?: OpenMeteoResult[] };

  return (json.results ?? [])
    .filter(
      (r): r is Required<Pick<OpenMeteoResult, 'name' | 'latitude' | 'longitude' | 'timezone'>> &
        OpenMeteoResult =>
        typeof r.name === 'string' &&
        typeof r.latitude === 'number' &&
        typeof r.longitude === 'number' &&
        typeof r.timezone === 'string',
    )
    .map((r) => ({
      name: r.name,
      label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      // Rounded to ~11m. Precision beyond this is false confidence about a
      // town centroid, and it keeps the cache key stable across lookups.
      latitude: Number(r.latitude.toFixed(4)),
      longitude: Number(r.longitude.toFixed(4)),
      timezone: r.timezone,
      country: r.country ?? null,
    }));
}
