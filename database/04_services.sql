-- ============================================================================
-- 04_services.sql — the consultation catalogue
--
-- Public-readable (active rows only). Pricing must be visible without login:
-- gating price behind auth is a documented conversion loss (research §3.3).
-- ============================================================================

create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  tagline          text,                      -- one line, used on cards
  description      text not null,             -- long form, service page
  highlights       text[] not null default '{}',  -- bullet list on service page
  ideal_for        text[] not null default '{}',  -- "who is this for" list

  -- MONEY IS ALWAYS PAISE (integer). Never rupees, never a float.
  -- Research §4.5: Razorpay is paise-native; storing rupees guarantees an
  -- eventual rounding bug in something that handles money.
  price_paise      bigint not null check (price_paise >= 0),
  compare_at_paise bigint check (compare_at_paise is null or compare_at_paise > price_paise),
  currency         char(3) not null default 'INR',

  duration_minutes integer not null check (duration_minutes between 5 and 480),
  -- Gap enforced after this service so the practitioner is not booked
  -- back-to-back with no breathing room.
  buffer_minutes   integer not null default 10 check (buffer_minutes >= 0),

  mode             text not null default 'video'
                     check (mode in ('video','phone','in_person')),

  active           boolean not null default true,
  bookable_online  boolean not null default true,  -- false => enquiry-only
  featured         boolean not null default false,
  sort_order       integer not null default 0,

  -- Staff-only row. NOT the same thing as `active = false`.
  --
  -- `active = false` means "not bookable at all": get_available_slots(),
  -- create_slot_hold() and create_pending_appointment() all require
  -- active = true, so an inactive service cannot be booked by anyone, admin
  -- included. That is correct for a retired service and useless for a live
  -- payment test, which needs the whole booking and payment path to run for
  -- real.
  --
  -- `internal = true` means "fully bookable, but not part of the catalogue".
  -- The ₹1 verification service uses it: every function behaves normally,
  -- while the public select policy below refuses to return the row to anyone
  -- who is not an admin.
  internal         boolean not null default false,

  -- How far ahead bookings open, and the minimum notice required. Both are
  -- practical needs of a solo practitioner: no 3am same-minute bookings.
  min_notice_hours integer not null default 12 check (min_notice_hours >= 0),
  max_advance_days integer not null default 60 check (max_advance_days > 0),

  -- Per-service cancellation window in hours; NULL falls back to the global
  -- default in the application config.
  free_cancellation_hours integer check (free_cancellation_hours >= 0),

  seo_title        text,
  seo_description  text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

-- Anonymous visitors can read the active catalogue. This is the only table in
-- the schema readable without authentication, and it is intentional.
--
-- `internal = false` is part of the POLICY, not just the application queries.
-- A ₹1 verification service is a real bookable consultation, so a row that
-- leaked into a public listing would let any visitor buy a full session for a
-- rupee. Application-level filtering would be one forgotten `.eq()` away from
-- that; enforcing it here means the database refuses to hand the row over,
-- whatever the query says.
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public" on public.services
  for select using (active = true and internal = false);

drop policy if exists "services_select_admin" on public.services;
create policy "services_select_admin" on public.services
  for select using (public.is_admin());

drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());
