import { searchPlaces } from '@/lib/astrology/geocode';
import { AstrologyProviderError } from '@/lib/astrology/provider';
import { ok, fail } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Place lookup for the birth-details forms.
 *
 * Proxied through our own route rather than called from the browser for two
 * reasons that both matter:
 *
 *  1. It keeps every third-party astrology dependency behind one origin, so
 *     the client never learns which suppliers are in use and swapping one does
 *     not require a client release.
 *  2. It is the only place a rate limit can be applied. A keyless public
 *     geocoder called straight from the browser is an open relay to a free
 *     service that will eventually block us for it.
 *
 * No personal data crosses this route — a place name is not identifying — so
 * there is no consent gate here, only on the calculators themselves.
 */
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';

  // Typeahead fires per keystroke, so the ceiling is generous — but it is a
  // ceiling. Without one a single stuck client can burn the upstream's
  // goodwill for everybody.
  const limit = rateLimit(`geo:${clientIp(request.headers)}`, 60, 60_000);
  if (!limit.allowed) {
    return fail('rate_limited', 'Too many lookups. Please wait a moment.', 429);
  }

  if (query.trim().length < 2) return ok({ places: [] });

  try {
    return ok({ places: await searchPlaces(query) });
  } catch (error) {
    if (error instanceof AstrologyProviderError) {
      return fail(error.code, error.message, error.status);
    }
    console.error('[astrology/places]', error);
    return fail('upstream_error', 'Could not look up that place. Please try again.', 502);
  }
}
