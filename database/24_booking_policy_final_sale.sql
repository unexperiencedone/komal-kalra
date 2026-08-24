-- ============================================================================
-- 24_booking_policy_final_sale.sql
--
-- Policy change: a paid booking is FINAL.
--
--   • A client cannot cancel it.
--   • A client cannot reschedule it themselves — they phone, and Komal moves it.
--   • It can be moved at most ONCE.
--
-- ⚠️  THIS RESTRICTS THE CLIENT, NOT THE PRACTITIONER.
--
-- Komal keeps every power she had: cancel, reschedule, refund. She acts through
-- the admin surfaces, which use the service-role client and are not subject to
-- the trigger below. That asymmetry is the entire point of the change, and it
-- is also what keeps the policy lawful — see the note in src/lib/config.ts.
--
-- Refunds are NOT disabled anywhere in the schema. `confirm_appointment_payment`
-- has a path where money captures but the slot is lost, and that money has to be
-- returnable. A schema that made refunds impossible would strand it.
--
-- Idempotent. Safe on a fresh or existing database, and safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Reschedule counter.
--
-- Column added BEFORE anything references it. Getting that order wrong is what
-- dropped the services select policy and emptied the catalogue once; see
-- 21_repair_services_policy.sql.
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column if not exists reschedule_count integer not null default 0;

comment on column public.appointments.reschedule_count is
  'How many times this booking has been moved. Capped at POLICY.maxReschedules '
  '(1) by the trigger below. Counted on the row that is moved, and carried '
  'forward when a reschedule creates a successor row.';

-- A CHECK rather than trusting the trigger alone: the trigger enforces the
-- transition, this enforces the value, and a bad UPDATE from any source — psql
-- included — is rejected by the table itself.
alter table public.appointments
  drop constraint if exists appointments_reschedule_cap;
alter table public.appointments
  add constraint appointments_reschedule_cap
  check (reschedule_count >= 0 and reschedule_count <= 1);


-- ---------------------------------------------------------------------------
-- 2. Clients may no longer change status at all.
--
-- The previous version of this trigger allowed exactly one client transition:
--
--     if new.status is distinct from old.status and new.status <> 'cancelled'
--
-- i.e. a client could set 'cancelled'. That is the line the policy change
-- removes. Everything else in the function is unchanged — price, timing,
-- service and ownership were already immutable from the client side.
--
-- `is_service_role()` is what lets Komal through: the admin actions use the
-- service-role client, so her cancellations and reschedules are unaffected.
-- ---------------------------------------------------------------------------
create or replace function public.protect_appointment_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Service role is Komal acting through the admin console. She may do all of
  -- this; the restrictions below exist to stop a CLIENT doing it.
  if public.is_service_role() then
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

  -- No client-initiated status change of any kind. Bookings are final; moving
  -- one is arranged by phone and performed by Komal.
  if new.status is distinct from old.status then
    raise exception 'Bookings cannot be changed here. Please call to arrange a change.'
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
-- 3. Reschedule, performed by Komal.
--
-- Moves a booking to a new time in ONE transaction, so the old slot is never
-- released without the new one being secured. The exclusion constraint on
-- appointments is what makes that safe: if the target time is taken, the whole
-- transaction rolls back and the client keeps their original booking rather
-- than losing both.
--
-- Returns a discriminated jsonb result rather than raising for expected cases,
-- matching confirm_appointment_payment — "already at the limit" is an answer,
-- not an exception.
-- ---------------------------------------------------------------------------
create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_starts_at  timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_appt    public.appointments%rowtype;
  v_service public.services%rowtype;
  v_new_ends timestamptz;
begin
  if not public.is_service_role() and not public.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;

  select * into v_appt from public.appointments
   where id = p_appointment_id for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if v_appt.status not in ('confirmed', 'pending_payment') then
    return jsonb_build_object('result', 'illegal_transition', 'status', v_appt.status);
  end if;

  if v_appt.reschedule_count >= 1 then
    return jsonb_build_object('result', 'limit_reached', 'reschedule_count', v_appt.reschedule_count);
  end if;

  select * into v_service from public.services where id = v_appt.service_id;
  v_new_ends := p_new_starts_at + make_interval(mins => v_service.duration_minutes);

  begin
    update public.appointments
       set starts_at = p_new_starts_at,
           ends_at   = v_new_ends,
           reschedule_count = v_appt.reschedule_count + 1,
           reschedule_requested_at = now()
     where id = v_appt.id;
  exception
    -- The target time overlaps an existing booking. Roll back rather than
    -- leaving the client with no appointment at all.
    when exclusion_violation then
      return jsonb_build_object('result', 'slot_conflict', 'requested_at', p_new_starts_at);
  end;

  return jsonb_build_object(
    'result', 'rescheduled',
    'appointment_id', v_appt.id,
    'starts_at', p_new_starts_at,
    'reschedule_count', v_appt.reschedule_count + 1
  );
end;
$$;

revoke all on function public.reschedule_appointment(uuid, timestamptz) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. Retire the per-service free-cancellation window.
--
-- The column stays — dropping it would break existing reads — but every value
-- is zeroed so nothing can present a cancellation window that no longer exists.
-- ---------------------------------------------------------------------------
update public.services set free_cancellation_hours = 0
 where free_cancellation_hours is distinct from 0;


-- ---------------------------------------------------------------------------
-- 5. Confirm.
-- ---------------------------------------------------------------------------
select
  count(*) filter (where reschedule_count = 0) as never_moved,
  count(*) filter (where reschedule_count = 1) as moved_once,
  count(*)                                     as total
  from public.appointments;
