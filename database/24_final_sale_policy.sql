-- ============================================================================
-- 24_final_sale_policy.sql — bookings are final; one reschedule, by phone
--
-- Two rules, both enforced HERE rather than only in the UI:
--
--   1. A client cannot cancel. Hiding the button is not enforcement — the
--      update policy is reachable by anyone who can call PostgREST with their
--      own JWT, which is anyone who can open devtools.
--   2. A booking may be rescheduled at most once, and only by staff.
--
-- ⚠️  WHAT THIS DOES NOT DO — and must not.
--
-- It does not remove the ability to refund or to cancel ADMINISTRATIVELY.
-- `appointments_write_admin` is untouched and the service role bypasses all of
-- this. That capability is required, not merely convenient:
--
--   • Komal cancelling, or being unable to hold a session, must still return
--     the client's money. Keeping payment for a service never delivered is not
--     a strict policy; and an exclusion that broad reads as an unfair term
--     under the Consumer Protection Act 2019, which risks the enforceable
--     parts of the policy along with it.
--   • confirm_appointment_payment() has a live path where money captures but
--     the slot was taken in between — the appointment lands in
--     `needs_attention` specifically so it can be refunded. 17_functions_
--     payments.sql commits to this in as many words: "We never silently keep
--     money for a booking that does not exist."
--
-- Idempotent. Safe on a fresh or existing database, and safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Reschedule counter.
--
-- A counter, not a boolean. `rescheduled_from_id` already chains appointments,
-- but counting a chain means walking it on every check, and the chain is
-- rewritten by admin edits. An integer on the row is the thing the rule is
-- actually about.
--
-- `add column if not exists` BEFORE anything that references it — getting that
-- order wrong dropped a policy and emptied the catalogue once already
-- (see 21_repair_services_policy.sql).
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column if not exists reschedule_count integer not null default 0;

comment on column public.appointments.reschedule_count is
  'Times this booking has been moved. Capped at 1 by protect_appointment_columns(); '
  'see POLICY.maxReschedules in src/lib/config.ts.';

-- ---------------------------------------------------------------------------
-- 2. Client update policy — remove `cancelled` from WITH CHECK.
--
-- Previously the policy permitted a client to move a row to `cancelled`. It no
-- longer does, so the transition is refused at the row-security layer before
-- the trigger is even reached.
-- ---------------------------------------------------------------------------
drop policy if exists "appointments_update_own_limited" on public.appointments;
create policy "appointments_update_own_limited" on public.appointments
  for update
  using (
    (select auth.uid()) = user_id
    and status in ('pending_payment','confirmed')
  )
  with check (
    (select auth.uid()) = user_id
    -- 'cancelled' deliberately absent: bookings are final.
    and status in ('pending_payment','confirmed')
  );

-- ---------------------------------------------------------------------------
-- 3. Column guard — no client status changes at all, and cap the reschedules.
-- ---------------------------------------------------------------------------
create or replace function public.protect_appointment_columns()
returns trigger
language plpgsql
as $$
begin
  -- Admin and service role are exempt. This is what keeps Komal-side
  -- cancellation and refund possible; see the header.
  if public.is_service_role() or public.is_admin() then
    -- The cap applies to STAFF too, but as a real limit rather than a block:
    -- moving a booking a second time is a decision, not an accident, so it
    -- fails loudly instead of silently incrementing past the policy.
    if new.reschedule_count is distinct from old.reschedule_count
       and new.reschedule_count > 1 then
      raise exception 'A booking may be rescheduled once. Cancel and rebook instead.'
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  if new.price_paise    is distinct from old.price_paise
  or new.total_paise    is distinct from old.total_paise
  or new.discount_paise is distinct from old.discount_paise
  or new.tax_paise      is distinct from old.tax_paise
  or new.payment_status is distinct from old.payment_status
  or new.starts_at      is distinct from old.starts_at
  or new.ends_at        is distinct from old.ends_at
  or new.service_id     is distinct from old.service_id
  or new.user_id        is distinct from old.user_id
  or new.reschedule_count is distinct from old.reschedule_count
  then
    raise exception 'This field cannot be modified directly'
      using errcode = '42501';
  end if;

  -- No client-initiated status change of ANY kind now. Cancellation used to be
  -- the one permitted transition; bookings are final, so there is none left.
  if new.status is distinct from old.status then
    raise exception 'Bookings cannot be cancelled or changed online. Please call us.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_protect_columns on public.appointments;
create trigger appointments_protect_columns
  before update on public.appointments
  for each row execute function public.protect_appointment_columns();

-- ---------------------------------------------------------------------------
-- 4. Services: no per-service free-cancellation window.
--
-- The column stays — dropping it would break every call site that reads it —
-- but every row is set to 0 and the default follows, so no service can carry a
-- window that contradicts the site-wide policy.
-- ---------------------------------------------------------------------------
update public.services set free_cancellation_hours = 0
 where free_cancellation_hours is distinct from 0;

alter table public.services
  alter column free_cancellation_hours set default 0;

-- ---------------------------------------------------------------------------
-- 5. Verify. Expect: policy present, trigger present, all services at 0.
-- ---------------------------------------------------------------------------
select policyname, cmd from pg_policies
 where schemaname = 'public' and tablename = 'appointments'
 order by policyname;

select count(*) filter (where free_cancellation_hours = 0) as at_zero,
       count(*) as total
  from public.services;
