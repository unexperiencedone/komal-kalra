-- ============================================================================
-- 06_slot_holds.sql — temporary slot reservations
--
-- WHY THIS TABLE EXISTS (research §5.3, layer 1)
-- Between "user picks 4:00 PM" and "webhook confirms payment" there is a
-- multi-minute window. Without a hold, a second user sees 4:00 PM as free,
-- pays, and now two people own the same slot. The brief called this something
-- to "consider"; it is not optional.
--
-- Holds also double as ABANDONED BOOKING capture (research §3.4): an expired
-- hold still carries the contact details the visitor entered, and the admin
-- Leads screen surfaces it as a warm lead rather than deleting it.
-- ============================================================================

create table if not exists public.slot_holds (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services(id) on delete cascade,

  -- Nullable: guests can hold a slot before authenticating. Conversion research
  -- is unambiguous that forcing signup before slot selection loses buyers.
  user_id      uuid references public.profiles(id) on delete set null,

  -- Opaque browser-scoped id, so an anonymous visitor can reclaim their own
  -- hold on refresh and is not blocked by it.
  session_key  text not null,

  starts_at    timestamptz not null,
  ends_at      timestamptz not null,

  expires_at   timestamptz not null,
  released_at  timestamptz,   -- set when converted to an appointment or freed

  -- Contact details captured during checkout, retained after expiry so an
  -- abandoned booking is a usable lead.
  guest_name   text,
  guest_email  text,
  guest_phone  text,

  converted_appointment_id uuid,  -- FK added in 07_appointments.sql
  lead_captured boolean not null default false,

  created_at   timestamptz not null default now(),

  constraint slot_holds_time_order check (ends_at > starts_at)
);

comment on table public.slot_holds is
  'Soft reservations with a TTL. An unexpired, unreleased hold makes a slot unavailable to everyone except its own session.';

-- A hold is "live" when it has not expired and has not been released.
-- STABLE, not IMMUTABLE: it reads now().
create or replace function public.hold_is_live(h public.slot_holds)
returns boolean
language sql
stable
as $$
  select h.released_at is null and h.expires_at > now();
$$;

alter table public.slot_holds enable row level security;

-- Holds are created and read exclusively through server-side code using the
-- service-role key (see src/lib/booking/holds.ts). No end-user policy is
-- granted, because a client that could read holds could enumerate the
-- practitioner's booking pattern, and a client that could write them could
-- trivially block the entire calendar.
--
-- RLS is still enabled: with RLS on and no policies, PostgREST denies all
-- access to anon and authenticated, which is exactly what we want.

drop policy if exists "slot_holds_select_admin" on public.slot_holds;
create policy "slot_holds_select_admin" on public.slot_holds
  for select using (public.is_admin());
