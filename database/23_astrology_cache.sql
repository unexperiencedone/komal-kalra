-- ============================================================================
-- 23_astrology_cache.sql — cache for third-party astrology results
--
-- WHY THIS EXISTS: IT IS THE ARCHITECTURE, NOT AN OPTIMISATION.
--
-- Prokerala's free tier is 5,000 credits a month. A Panchang call costs 10 of
-- them. The Panchang widget sits on a public page, so UNCACHED it would spend
-- the entire monthly allowance in about 500 page views — roughly a fortnight
-- of modest traffic — after which the page starts erroring for everybody.
--
-- Cached per (date, city) for a day, the same widget costs 10 credits per city
-- per day: twelve cities is about 3,600 credits a YEAR.
--
-- Birth charts are cached indefinitely, because they genuinely never change.
-- The same birth moment and place always produce the same chart; a cache miss
-- for a repeat visitor is money spent to compute an answer we already had.
--
-- WHY POSTGRES AND NOT MEMORY
--
-- Serverless instances do not share memory. An in-process cache is per
-- instance, so under any real concurrency it multiplies calls by the number of
-- warm instances rather than reducing them — the opposite of the intent. This
-- table is shared by every instance and survives cold starts.
--
-- Idempotent. Safe on a fresh or existing database, and safe to re-run.
-- ============================================================================

create table if not exists public.astrology_cache (
  -- A hash of provider + endpoint + normalised inputs. Built in the
  -- application (src/lib/astrology/cache.ts) so the key rule lives with the
  -- code that has to agree on it.
  cache_key   text primary key,

  provider    text not null,
  endpoint    text not null,
  payload     jsonb not null,

  -- NULL means "never expires" — that is the birth-chart case, and it is a
  -- deliberate distinction rather than a very long TTL. A far-future timestamp
  -- would eventually arrive and silently re-bill for an unchanged answer.
  expires_at  timestamptz,

  hits        integer not null default 0,
  created_at  timestamptz not null default now(),
  last_read_at timestamptz
);

comment on table public.astrology_cache is
  'Third-party astrology responses, keyed on normalised inputs. Exists to keep '
  'a metered API within its credit budget; see the header of 23_astrology_cache.sql.';

-- Sweeping expired rows is the only query that does not go through the primary
-- key, so it is the only one that needs an index. Partial, because rows with a
-- NULL expiry are never swept and there is no reason to index them.
create index if not exists astrology_cache_expiry_idx
  on public.astrology_cache (expires_at)
  where expires_at is not null;

alter table public.astrology_cache enable row level security;

-- ---------------------------------------------------------------------------
-- NO POLICIES, DELIBERATELY.
--
-- RLS is enabled with no policy granting access, so anon and authenticated can
-- read nothing. Only the service-role client reaches this table, and only from
-- route handlers under /api/astrology.
--
-- It holds derived results keyed on birth date, time and place. That is
-- personal data under the DPDP Act even though no name is stored, and a cache
-- is not a place anyone should be able to browse.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Sweep. Call from the existing cron route, or leave it: expired rows are
-- ignored on read, so this is housekeeping rather than correctness.
-- ---------------------------------------------------------------------------
create or replace function public.sweep_astrology_cache()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.astrology_cache
   where expires_at is not null and expires_at < now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.sweep_astrology_cache() from public, anon, authenticated;
