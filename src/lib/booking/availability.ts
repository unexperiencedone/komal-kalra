import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { businessDateKey } from '@/lib/date';
import type { Service } from '@/types/database';

/**
 * Availability reads.
 *
 * Slots are DERIVED in Postgres by get_available_slots(), never materialised.
 * That means the calendar can never disagree with the appointments table, which
 * is the only stored truth about whether a time is taken (docs/research.md §5).
 */

export interface Slot {
  start: string;  // ISO
  end: string;    // ISO
}

export interface DaySlots {
  /** YYYY-MM-DD in the business timezone. */
  date: string;
  slots: Slot[];
}

interface RawSlot { slot_start: string; slot_end: string }

export async function getAvailableSlots(params: {
  serviceId: string;
  from: Date;
  to: Date;
  sessionKey?: string | null;
}): Promise<DaySlots[]> {
  // Service role: get_available_slots is granted to anon, but running it with
  // the service key keeps a consistent path and avoids a second round trip for
  // an auth check that the function does not need.
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('get_available_slots', {
    p_service_id: params.serviceId,
    p_from: businessDateKey(params.from),
    p_to: businessDateKey(params.to),
    p_session_key: params.sessionKey ?? null,
  });

  if (error) {
    console.error('[availability] get_available_slots failed', error);
    return [];
  }

  const grouped = new Map<string, Slot[]>();
  for (const row of (data ?? []) as RawSlot[]) {
    const key = businessDateKey(row.slot_start);
    const list = grouped.get(key) ?? [];
    list.push({ start: row.slot_start, end: row.slot_end });
    grouped.set(key, list);
  }

  return Array.from(grouped.entries())
    .map(([date, slots]) => ({ date, slots }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Why the `internal` split is done in JavaScript and not with `.eq()`.
 *
 * THIS BLANKED THE WHOLE CATALOGUE ONCE. Do not "tidy" it back into the query.
 *
 * The first version filtered in PostgREST — `.eq('internal', false)`. Against a
 * database where the column had not been added yet, PostgREST answers 400
 * (`42703 column services.internal does not exist`). The destructure was
 * `const { data } = …`, which throws the error away, so `data ?? []` returned an
 * EMPTY catalogue. Every service disappeared from the site and nothing was
 * logged. A deploy that runs ahead of its migration is a completely ordinary
 * state, and the failure it produced here was both total and silent.
 *
 * Reading the column off the row instead is immune to that: on a database
 * without the column, `row.internal` is `undefined`, `!undefined` is true, and
 * every service is returned exactly as before. The feature degrades to "no
 * verification service yet"; the catalogue never degrades at all.
 *
 * Security does not rest on this filter in any case — the RLS policy
 * (`active = true and internal = false`) is what stops a non-admin reading an
 * internal row. This filter exists only so that an ADMIN browsing the marketing
 * site sees the same catalogue as everyone else, since RLS would otherwise let
 * the row through for her alone.
 */
function isPublic(service: Service): boolean {
  return service.internal !== true;
}

/**
 * Public catalogue read.
 *
 * Uses the COOKIE-FREE public client. This is load-bearing: the marketing
 * layout and `/services/[slug]` are prerendered, and `cookies()` cannot be
 * called during a prerender — doing so threw DYNAMIC_SERVER_USAGE and returned
 * a 500 from ISR on Vercel while working perfectly in `next dev`, which
 * renders everything dynamically. See src/lib/supabase/public.ts.
 *
 * RLS still applies; the anon role sees exactly the public catalogue.
 */
export async function getActiveServices(): Promise<Service[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .returns<Service[]>();

  // An empty catalogue and a failed query look identical downstream — every
  // page just renders no services. Say which one happened.
  if (error) console.error('[services] catalogue read failed:', error.message);

  return (data ?? []).filter(isPublic);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  // Cookie-free — this page is prerendered. See getActiveServices above.
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle<Service>();

  if (error) console.error(`[services] read failed for "${slug}":`, error.message);

  return data && isPublic(data) ? data : null;
}

/**
 * Internal (staff-only) services, for the booking flow's consultation list.
 *
 * Returns [] for anyone who is not an admin, and does so twice over: the caller
 * checks the role, and the RLS policy would return nothing anyway because this
 * uses the anon-scoped cookie client rather than the service-role client. That
 * matters — reaching for the service-role client here would bypass RLS and make
 * the guard purely application-level, which is exactly the "hardcoded admin
 * privileges in frontend-reachable code" the brief rules out.
 *
 * On a database that has not run the migration yet, `internal` is undefined on
 * every row and this correctly returns nothing.
 */
export async function getInternalServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .returns<Service[]>();

  if (error) console.error('[services] internal read failed:', error.message);

  return (data ?? []).filter((s) => s.internal === true);
}
