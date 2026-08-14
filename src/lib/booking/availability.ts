import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
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

/** Public catalogue read. Uses the anon-scoped client, so RLS applies. */
export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .returns<Service[]>();
  return data ?? [];
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle<Service>();
  return data;
}
