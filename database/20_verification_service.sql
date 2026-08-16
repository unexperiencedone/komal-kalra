-- ============================================================================
-- 20_verification_service.sql — the ₹1 live-payment check
--
-- WHAT THIS IS FOR
--
-- Razorpay live keys cannot be proven to work in test mode. Test mode uses a
-- different key pair, a different webhook secret and a sandbox that never
-- touches a real bank, so a green test run tells you nothing about whether
-- production will settle money. The only honest check is one real payment, and
-- ₹1 is the cheapest real payment there is.
--
-- This seeds a genuine consultation priced at 100 paise. It is not a mock and
-- it is not a shortcut past the payment code: booking it runs the identical
-- path as a ₹2,100 booking — slot hold, advisory lock, order creation,
-- signature verification, webhook, confirmation email. That is the point. A
-- fake "test payment" button would exercise none of it and would prove nothing.
--
-- WHY IT IS SAFE TO LEAVE IN PRODUCTION
--
-- `internal = true`, and the public select policy in 04_services.sql is
-- `active = true and internal = false`. An anonymous visitor or a signed-in
-- client asking for this row gets nothing back — not a filtered-out row, no
-- row. Only `is_admin()` can see it. There is nothing to remember to switch
-- off, which is the useful property: a temporary ₹1 service that someone
-- forgets to delete is a standing offer to buy a real session for a rupee.
--
-- `active` stays TRUE deliberately. The booking functions require it, so
-- setting it false would make the service unbookable and defeat the purpose.
-- Concealment is `internal`'s job, not `active`'s.
--
-- Idempotent — safe to run against a fresh database or an existing one.
-- See docs/payment-verification.md for the procedure.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Migration for databases created before `internal` existed.
-- Fresh installs get the column from 04_services.sql; this is a no-op there.
-- ---------------------------------------------------------------------------
alter table public.services
  add column if not exists internal boolean not null default false;

-- Recreate the public policy so an existing database picks up the internal
-- exclusion. Identical to the definition in 04_services.sql — if you change
-- one, change both.
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public" on public.services
  for select using (active = true and internal = false);

-- ---------------------------------------------------------------------------
-- The service itself.
--
-- 15 minutes rather than 45: if a real client somehow ends up in this slot,
-- the damage is a quarter hour, not most of an afternoon. min_notice_hours is
-- 0 so it can be booked immediately — waiting 12 hours to test a payment key
-- is not a workflow anyone will follow.
-- ---------------------------------------------------------------------------
insert into public.services
  (slug, title, tagline, description, highlights, ideal_for,
   price_paise, duration_minutes, buffer_minutes, mode,
   active, internal, bookable_online, featured, sort_order,
   min_notice_hours, max_advance_days, free_cancellation_hours)
values
  (
    'guidance-verification',
    'Astrological Guidance — ₹1 payment verification',
    'Internal use only. Confirms live Razorpay keys, signature checking and webhooks against a real transaction.',
    'A ₹1 booking that runs the complete production payment path: slot hold, order creation, Razorpay Checkout, HMAC signature verification, webhook delivery and appointment confirmation. Not a client-facing consultation. Visible only to administrators, and hidden from the public catalogue by row-level security rather than by application code.',
    array[
      'Charges a real ₹1 through live Razorpay keys',
      'Exercises the same code path as a full-price booking',
      'Refundable from the admin console like any other payment'
    ],
    array['Administrators verifying that payments work end to end'],
    100,      -- ₹1, in paise. Razorpay's minimum live capture.
    15,       -- short, so a mis-booking costs a quarter hour
    0,        -- no buffer needed; this is not a real appointment
    'video',
    true,     -- MUST stay true — the booking functions require it
    true,     -- internal: hidden from every non-admin by RLS
    true,     -- bookable_online: the whole point
    false,    -- never featured
    999,      -- sorts last wherever an admin does see it
    0,        -- bookable immediately; no 12-hour wait to test a key
    7,        -- only a week ahead; it does not belong in the calendar
    0         -- cancellable free at any point
  )
on conflict (slug) do update set
  price_paise      = excluded.price_paise,
  duration_minutes = excluded.duration_minutes,
  active           = excluded.active,
  internal         = excluded.internal,
  bookable_online  = excluded.bookable_online,
  min_notice_hours = excluded.min_notice_hours,
  title            = excluded.title,
  tagline          = excluded.tagline;

-- ---------------------------------------------------------------------------
-- To remove it entirely (bookings referencing it must be deleted first, or
-- this will fail on the foreign key — which is the desired behaviour, since it
-- stops you erasing the service a real payment record points at):
--
--   delete from public.services where slug = 'guidance-verification';
--
-- Hiding it again without deleting:
--
--   update public.services set bookable_online = false
--    where slug = 'guidance-verification';
-- ---------------------------------------------------------------------------
