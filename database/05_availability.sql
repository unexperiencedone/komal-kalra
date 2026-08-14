-- ============================================================================
-- 05_availability.sql — when the practitioner can be booked
--
-- DESIGN NOTE (research §9, change 5)
-- The brief described a single `availability` table with one row per date.
-- That is rejected: a recurring weekly schedule stored per-date is 365 rows to
-- edit whenever Tuesday hours change, and it drifts out of date silently.
--
-- Instead:
--   availability_rules       recurring weekly pattern (the normal case)
--   availability_exceptions  one-off blocks and one-off extra openings
--
-- Bookable slots are DERIVED at query time from rules − exceptions − existing
-- appointments − live holds. Slots are never materialised, so there is exactly
-- one source of truth for "is this time taken": the appointments table.
-- ============================================================================

create table if not exists public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  -- 0 = Sunday … 6 = Saturday, matching JS getDay() and Postgres EXTRACT(dow).
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  -- Granularity of generated slot start times, in minutes.
  slot_interval_minutes integer not null default 30
    check (slot_interval_minutes between 5 and 240),
  active      boolean not null default true,
  label       text,                       -- e.g. "Morning", "Evening"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint availability_rules_time_order check (end_time > start_time)
);

drop trigger if exists availability_rules_set_updated_at on public.availability_rules;
create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

-- One-off deviations. `available = false` blocks time (holiday, personal);
-- `available = true` opens time outside the normal weekly pattern.
create table if not exists public.availability_exceptions (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  -- NULL start/end with available = false means the WHOLE DAY is blocked.
  start_time  time,
  end_time    time,
  available   boolean not null default false,
  reason      text,
  created_at  timestamptz not null default now(),

  constraint availability_exceptions_time_order
    check (start_time is null or end_time is null or end_time > start_time),
  constraint availability_exceptions_full_day_is_a_block
    check (not (start_time is null and available = true))
);

alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;

-- Public read: the booking calendar must render for anonymous visitors.
-- Note this exposes only *when Komal works*, never who is booked.
drop policy if exists "availability_rules_select_public" on public.availability_rules;
create policy "availability_rules_select_public" on public.availability_rules
  for select using (active = true);

drop policy if exists "availability_rules_write_admin" on public.availability_rules;
create policy "availability_rules_write_admin" on public.availability_rules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "availability_exceptions_select_public" on public.availability_exceptions;
create policy "availability_exceptions_select_public" on public.availability_exceptions
  for select using (true);

drop policy if exists "availability_exceptions_write_admin" on public.availability_exceptions;
create policy "availability_exceptions_write_admin" on public.availability_exceptions
  for all using (public.is_admin()) with check (public.is_admin());
