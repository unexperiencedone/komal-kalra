import { z } from 'zod';
import { prokerala, isAstrologyConfigured } from '@/lib/astrology/prokerala';
import { AstrologyProviderError, type BirthInput } from '@/lib/astrology/provider';
import { cached, CACHE_FOREVER, CACHE_ONE_DAY } from '@/lib/astrology/cache';
import { recordToolLead } from '@/lib/astrology/leads';
import {
  birthSchema,
  toolLeadSchema,
  panchangRequestSchema,
} from '@/lib/astrology/schemas';
import { ok, fail, fromZodError } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * One handler for every astrology tool.
 *
 * A single route rather than one per tool because the differences between them
 * are two lines — which provider method, and which cache TTL. Five near-
 * identical route files would drift, and the rate limit, consent check and
 * error mapping would end up subtly different in each.
 *
 * ⚠️  THE PROVIDER SECRET NEVER LEAVES THIS PROCESS. That is the whole reason
 * the browser talks to us instead of to Prokerala. Do not add a client-side
 * fetch to the provider, however convenient — the client id and secret would
 * ship in the bundle.
 */
export const runtime = 'nodejs';

const TOOL_TITLES: Record<string, string> = {
  'free-kundli': 'Free Kundli',
  'moon-sign': 'Moon Sign Calculator',
  lagna: 'Lagna Calculator',
  nakshatra: 'Nakshatra Calculator',
  'mangal-dosha': 'Mangal Dosha Calculator',
  'kundli-matching': 'Kundli Matching',
  panchang: 'Daily Panchang',
};

const requestSchema = z.discriminatedUnion('tool', [
  z.object({
    tool: z.literal('chart'),
    slug: z.string().min(1).max(40),
    birth: birthSchema,
    lead: toolLeadSchema,
  }),
  z.object({
    tool: z.literal('mangal-dosha'),
    slug: z.string().min(1).max(40),
    birth: birthSchema,
    lead: toolLeadSchema,
  }),
  z.object({
    tool: z.literal('matching'),
    slug: z.string().min(1).max(40),
    bride: birthSchema,
    groom: birthSchema,
    lead: toolLeadSchema,
  }),
  // Panchang takes no lead: it is a property of a date and a place, involves
  // no personal data, and gating it behind an email would be gating public
  // information.
  //
  // Written out rather than `.and(panchangRequestSchema)` — an intersection is
  // not a plain object, so a discriminated union cannot read the literal off
  // it and the whole union fails to typecheck.
  z.object({
    tool: z.literal('panchang'),
    date: panchangRequestSchema.shape.date,
    place: panchangRequestSchema.shape.place,
  }),
]);

const toInput = (b: z.infer<typeof birthSchema>): BirthInput => ({
  date: b.date,
  time: b.time,
  latitude: b.place.latitude,
  longitude: b.place.longitude,
  timezone: b.place.timezone,
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  // Deliberately tight. Every call past a cache miss spends real credits, and
  // an unbounded endpoint in front of a metered API is a way to have the
  // month's budget spent by one script in an afternoon.
  const limit = rateLimit(`astro:${ip}`, 12, 10 * 60_000);
  if (!limit.allowed) {
    return fail('rate_limited', 'You have run several calculations. Please try again shortly.', 429);
  }

  if (!isAstrologyConfigured()) {
    return fail(
      'not_configured',
      'The astrology service is not connected yet. Please try again later.',
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('bad_request', 'Malformed request.', 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  // Honeypot: answer exactly as a success would look, so the bot learns
  // nothing, but do no work and store nothing.
  if ('lead' in data && data.lead.website) {
    return ok({ result: null, cached: false });
  }

  try {
    switch (data.tool) {
      case 'chart': {
        const input = toInput(data.birth);
        // CACHE_FOREVER: the same birth moment and place always produce the
        // same chart. Re-billing for it would be paying twice for one answer.
        const { value, hit } = await cached('birth-chart', input, CACHE_FOREVER, () =>
          prokerala.birthChart(input),
        );
        await recordToolLead({
          lead: data.lead,
          toolSlug: data.slug,
          toolTitle: TOOL_TITLES[data.slug] ?? data.slug,
          ip,
        });
        return ok({ result: value, cached: hit });
      }

      case 'mangal-dosha': {
        const input = toInput(data.birth);
        const { value, hit } = await cached('mangal-dosha', input, CACHE_FOREVER, () =>
          prokerala.mangalDosha(input),
        );
        await recordToolLead({
          lead: data.lead,
          toolSlug: data.slug,
          toolTitle: TOOL_TITLES[data.slug] ?? data.slug,
          ip,
        });
        return ok({ result: value, cached: hit });
      }

      case 'matching': {
        const bride = toInput(data.bride);
        const groom = toInput(data.groom);
        const { value, hit } = await cached('guna-milan', { bride, groom }, CACHE_FOREVER, () =>
          prokerala.gunaMilan(bride, groom),
        );
        await recordToolLead({
          lead: data.lead,
          toolSlug: data.slug,
          toolTitle: TOOL_TITLES[data.slug] ?? data.slug,
          ip,
        });
        return ok({ result: value, cached: hit });
      }

      case 'panchang': {
        const params = {
          date: data.date,
          latitude: data.place.latitude,
          longitude: data.place.longitude,
          timezone: data.place.timezone,
        };
        // ONE DAY, not forever. A panchang is a property of a date, so it is
        // stable — but caching it forever would accumulate a row per city per
        // day with no upper bound and no reason to keep last March's.
        const { value, hit } = await cached('panchang', params, CACHE_ONE_DAY, () =>
          prokerala.panchang(params),
        );
        return ok({ result: value, cached: hit });
      }
    }
  } catch (error) {
    if (error instanceof AstrologyProviderError) {
      // The message on these is already written for a visitor to read; the
      // codes distinguish "busy, retry" from "we are out of credits", which
      // the UI needs to word differently.
      return fail(error.code, error.message, error.status);
    }
    console.error('[astrology/calculate]', error);
    return fail('upstream_error', 'Could not complete that calculation. Please try again.', 502);
  }
}
