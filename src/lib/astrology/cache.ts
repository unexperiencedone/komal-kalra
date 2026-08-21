import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Read-through cache for provider responses.
 *
 * The credit budget is the reason this exists — see the header of
 * database/23_astrology_cache.sql for the arithmetic. In short: uncached, one
 * public Panchang widget spends the whole monthly free tier in about 500 page
 * views.
 *
 * Service-role client, because `astrology_cache` has RLS on and no policies:
 * nothing but this module may touch it.
 */

/** Never expires. Birth charts are the same forever, so paying twice is waste. */
export const CACHE_FOREVER = null;

/** One day. Right for Panchang, which is a property of a date and a place. */
export const CACHE_ONE_DAY = 60 * 60 * 24;

/**
 * The key is a hash of the endpoint plus NORMALISED inputs.
 *
 * Normalisation is what makes the cache actually hit. Without it,
 * `{date, time}` and `{time, date}` — the same request written in a different
 * key order — hash differently and every call is a miss, which is a cache that
 * costs storage and saves nothing. Sorting keys and lowercasing strings makes
 * the key a function of the request's meaning rather than its spelling.
 */
export function cacheKey(endpoint: string, input: object): string {
  const normalise = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalise);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => v !== undefined && v !== null)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, normalise(v)]),
      );
    }
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  };

  const canonical = JSON.stringify({ endpoint, input: normalise(input) });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 48);
}

/**
 * Fetch through the cache.
 *
 * A cache failure NEVER fails the request. If Postgres is unreachable or the
 * table is missing because the migration has not run, this logs and calls the
 * provider directly — degrading to "works, costs a credit" rather than "the
 * tool is down". The cache is a cost control, not a dependency.
 */
export async function cached<T>(
  endpoint: string,
  input: object,
  ttlSeconds: number | null,
  compute: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  const key = cacheKey(endpoint, input);
  const db = createAdminClient();

  try {
    const { data } = await db
      .from('astrology_cache')
      .select('payload, expires_at')
      .eq('cache_key', key)
      .maybeSingle<{ payload: T; expires_at: string | null }>();

    // Expiry is checked HERE rather than with a `.gt()` filter in the query.
    // A filter would treat a NULL expiry as non-matching and miss every
    // never-expiring row — which is every birth chart, i.e. the entire point.
    const fresh = data && (!data.expires_at || new Date(data.expires_at) > new Date());

    if (fresh) {
      // Fire-and-forget: read stats must never add latency to a cache hit.
      void db
        .from('astrology_cache')
        .update({ hits: undefined, last_read_at: new Date().toISOString() })
        .eq('cache_key', key);

      return { value: data.payload, hit: true };
    }
  } catch (error) {
    console.error('[astrology] cache read failed, calling provider:', error);
  }

  const value = await compute();

  try {
    await db.from('astrology_cache').upsert(
      {
        cache_key: key,
        provider: 'prokerala',
        endpoint,
        payload: value,
        expires_at: ttlSeconds === null ? null : new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      },
      { onConflict: 'cache_key' },
    );
  } catch (error) {
    console.error('[astrology] cache write failed:', error);
  }

  return { value, hit: false };
}
