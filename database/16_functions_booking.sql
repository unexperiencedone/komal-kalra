-- ============================================================================
-- 16_functions_booking.sql — slot derivation, holds, and appointment creation
--
-- Everything here runs SECURITY DEFINER and is REVOKEd from anon/authenticated
-- at the bottom of the file, except get_available_slots() which must be
-- callable by anonymous visitors so the booking calendar renders.
--
-- The business timezone is fixed at Asia/Kolkata. Slot arithmetic is done in
-- local wall-clock time (because "Komal works 10:00–18:00" is a wall-clock
-- statement) and stored as timestamptz.
-- ============================================================================

create or replace function public.business_timezone()
returns text language sql immutable as $$ select 'Asia/Kolkata'::text $$;

-- ---------------------------------------------------------------------------
-- get_available_slots
--
-- Derives bookable slots from: weekly rules + one-off openings
--                            − one-off blocks
--                            − existing active appointments (incl. buffer)
--                            − live holds belonging to OTHER sessions
--                            − min-notice / max-advance windows
--
-- Slots are never materialised. There is exactly one stored truth for "is this
-- time taken" — the appointments table — so the calendar can never disagree
-- with reality (research §5.3).
-- ---------------------------------------------------------------------------
create or replace function public.get_available_slots(
  p_service_id  uuid,
  p_from        date,
  p_to          date,
  p_session_key text default null
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  tz        text := public.business_timezone();
  v_service public.services%rowtype;
  v_min_start timestamptz;
  v_max_start timestamptz;
begin
  select * into v_service from public.services
   where id = p_service_id and active = true and bookable_online = true;

  if not found then
    return;  -- unknown or unbookable service => no slots, not an error
  end if;

  -- Cap the window so a crafted request cannot ask for ten years of slots.
  if p_to - p_from > 92 then
    p_to := p_from + 92;
  end if;

  v_min_start := now() + make_interval(hours => v_service.min_notice_hours);
  v_max_start := now() + make_interval(days  => v_service.max_advance_days);

  return query
  with days as (
    select d::date as day
    from generate_series(p_from, p_to, interval '1 day') d
  ),
  -- Days blocked entirely (start_time IS NULL, available = false).
  full_day_blocks as (
    select date from public.availability_exceptions
     where available = false and start_time is null
  ),
  -- Working windows, resolved to absolute instants.
  --
  -- NOTE: the window bounds are converted to timestamptz HERE rather than
  -- later, because generate_series() has no `time` overload — it accepts
  -- integer, numeric, timestamp and timestamptz only. Generating over local
  -- wall-clock `time` values would not compile.
  windows as (
    select ((dy.day + r.start_time)::timestamp at time zone tz) as w_start,
           ((dy.day + r.end_time)::timestamp   at time zone tz) as w_end,
           r.slot_interval_minutes
      from days dy
      join public.availability_rules r
        on r.weekday = extract(dow from dy.day)::smallint
       and r.active = true
     where dy.day not in (select date from full_day_blocks)

    union all

    select ((ex.date + ex.start_time)::timestamp at time zone tz),
           ((ex.date + ex.end_time)::timestamp   at time zone tz),
           30
      from public.availability_exceptions ex
      join days dy on dy.day = ex.date
     where ex.available = true
       and ex.start_time is not null
       and ex.end_time is not null
  ),
  -- Every candidate start time inside every window. The upper bound of the
  -- series is the last instant at which the consultation still finishes inside
  -- the window.
  candidates as (
    select gs as c_start,
           gs + make_interval(mins => v_service.duration_minutes) as c_end
    from windows w
    cross join lateral generate_series(
      w.w_start,
      w.w_end - make_interval(mins => v_service.duration_minutes),
      make_interval(mins => w.slot_interval_minutes)
    ) as gs
    where w.w_end - w.w_start >= make_interval(mins => v_service.duration_minutes)
  ),
  bounded as (
    select distinct c_start, c_end
      from candidates
     where c_start >= v_min_start
       and c_start <= v_max_start
  )
  select b.c_start, b.c_end
    from bounded b
   where
     -- Not inside a partial-day block.
     not exists (
       select 1
         from public.availability_exceptions ex
        where ex.available = false
          and ex.start_time is not null
          and tstzrange(
                ((ex.date + ex.start_time)::timestamp at time zone tz),
                ((ex.date + ex.end_time)::timestamp at time zone tz),
                '[)'
              ) && tstzrange(b.c_start, b.c_end, '[)')
     )
     -- Not overlapping an active appointment, allowing for its buffer.
     and not exists (
       select 1
         from public.appointments a
         join public.services asv on asv.id = a.service_id
        where a.status in ('pending_payment','confirmed','rescheduled')
          and tstzrange(a.starts_at,
                        a.ends_at + make_interval(mins => asv.buffer_minutes),
                        '[)')
              && tstzrange(b.c_start,
                           b.c_end + make_interval(mins => v_service.buffer_minutes),
                           '[)')
     )
     -- Not held live by a DIFFERENT session. A visitor's own hold stays
     -- visible to them, so refreshing the page does not lock them out.
     and not exists (
       select 1
         from public.slot_holds h
        where h.released_at is null
          and h.expires_at > now()
          and (p_session_key is null or h.session_key is distinct from p_session_key)
          and tstzrange(h.starts_at, h.ends_at, '[)')
              && tstzrange(b.c_start, b.c_end, '[)')
     )
   order by b.c_start;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_slot_hold — layer 1 of the double-booking defence
--
-- The advisory lock serialises concurrent hold attempts on the same slot. It is
-- transaction-scoped (pg_advisory_xact_lock) so it auto-releases on commit or
-- rollback and cannot leak. Without it, two requests can both pass the
-- availability check microseconds apart.
-- ---------------------------------------------------------------------------
create or replace function public.create_slot_hold(
  p_service_id  uuid,
  p_starts_at   timestamptz,
  p_session_key text,
  p_user_id     uuid default null,
  p_ttl_minutes integer default 10
)
returns public.slot_holds
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_service public.services%rowtype;
  v_ends_at timestamptz;
  v_hold    public.slot_holds;
  v_lock_key bigint;
begin
  select * into v_service from public.services
   where id = p_service_id and active = true and bookable_online = true;
  if not found then
    raise exception 'Service is not available for online booking'
      using errcode = 'P0002';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);

  -- Serialise on the (service-agnostic) slot instant. Service-agnostic because
  -- two different services at the same time are still the same practitioner.
  v_lock_key := hashtextextended(to_char(p_starts_at at time zone 'UTC', 'YYYYMMDDHH24MI'), 0);
  perform pg_advisory_xact_lock(v_lock_key);

  -- Re-check availability INSIDE the lock. This is the whole point.
  if not exists (
    select 1 from public.get_available_slots(
      p_service_id,
      (p_starts_at at time zone public.business_timezone())::date - 1,
      (p_starts_at at time zone public.business_timezone())::date + 1,
      p_session_key
    ) s
    where s.slot_start = p_starts_at
  ) then
    raise exception 'That time is no longer available'
      using errcode = 'P0001';
  end if;

  -- Release any earlier live hold from this same session, so a visitor
  -- changing their mind does not accumulate locks across the calendar.
  update public.slot_holds
     set released_at = now()
   where session_key = p_session_key
     and released_at is null
     and expires_at > now();

  insert into public.slot_holds (
    service_id, user_id, session_key, starts_at, ends_at, expires_at
  ) values (
    p_service_id, p_user_id, p_session_key, p_starts_at, v_ends_at,
    now() + make_interval(mins => p_ttl_minutes)
  )
  returning * into v_hold;

  return v_hold;
end;
$$;

-- ---------------------------------------------------------------------------
-- release_slot_hold — explicit release (user backs out, or hold converted)
-- ---------------------------------------------------------------------------
create or replace function public.release_slot_hold(
  p_hold_id uuid,
  p_session_key text default null
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.slot_holds
     set released_at = now()
   where id = p_hold_id
     and released_at is null
     and (p_session_key is null or session_key = p_session_key)
  returning true;
$$;

-- ---------------------------------------------------------------------------
-- expire_stale_holds — housekeeping + abandoned-booking capture
--
-- Called by the reconciliation cron. Expired holds that carry contact details
-- and never converted become leads (research §3.4) rather than being deleted.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_holds()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  with promoted as (
    insert into public.leads (
      name, email, phone, message, source, status,
      service_id, intended_slot_at, slot_hold_id, user_id
    )
    select
      coalesce(h.guest_name, 'Abandoned booking'),
      h.guest_email,
      h.guest_phone,
      'Started a booking but did not complete payment.',
      'abandoned_booking',
      'new',
      h.service_id,
      h.starts_at,
      h.id,
      h.user_id
    from public.slot_holds h
    where h.expires_at <= now()
      and h.converted_appointment_id is null
      and h.lead_captured = false
      and (h.guest_email is not null or h.guest_phone is not null)
    returning slot_hold_id
  )
  update public.slot_holds h
     set lead_captured = true
    from promoted p
   where h.id = p.slot_hold_id;

  update public.slot_holds
     set released_at = now()
   where released_at is null
     and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_pending_appointment
--
-- The ONLY way an appointment row comes into existence from the application.
-- Clients have no INSERT policy on appointments precisely so that this function
-- is unavoidable: it computes the price from the database rather than trusting
-- anything the browser sent.
-- ---------------------------------------------------------------------------
create or replace function public.create_pending_appointment(
  p_user_id      uuid,
  p_service_id   uuid,
  p_hold_id      uuid,
  p_session_key  text,
  p_client_question text default null,
  p_subject_name    text default null,
  p_subject_birth_date  date default null,
  p_subject_birth_time  time default null,
  p_subject_birth_place text default null,
  p_subject_birth_time_known boolean default true,
  p_coupon_code  text default null,
  p_tax_bps      integer default 0   -- tax in basis points, 1800 = 18%
)
returns public.appointments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_service public.services%rowtype;
  v_hold    public.slot_holds%rowtype;
  v_appt    public.appointments;
  v_discount bigint := 0;
  v_coupon  public.coupons%rowtype;
  v_tax     bigint;
  v_net     bigint;
begin
  select * into v_service from public.services where id = p_service_id and active = true;
  if not found then
    raise exception 'Service not found' using errcode = 'P0002';
  end if;

  select * into v_hold from public.slot_holds
   where id = p_hold_id
     and session_key = p_session_key
     and released_at is null
     and expires_at > now()
     and converted_appointment_id is null
   for update;

  if not found then
    raise exception 'Your reservation has expired. Please choose a time again.'
      using errcode = 'P0001';
  end if;

  if v_hold.service_id <> p_service_id then
    raise exception 'Reservation does not match the selected service'
      using errcode = 'P0001';
  end if;

  -- Coupon, validated server-side. The client sends a CODE, never an amount.
  if p_coupon_code is not null then
    select * into v_coupon from public.coupons
     where code = upper(trim(p_coupon_code))
       and active = true
       and starts_at <= now()
       and (expires_at is null or expires_at > now())
       and (usage_limit is null or times_used < usage_limit)
       and (service_ids is null or p_service_id = any(service_ids))
       and min_order_paise <= v_service.price_paise
     for update;

    if found then
      if v_coupon.usage_limit_per_user is not null and exists (
        select 1 from public.coupon_redemptions cr
         where cr.coupon_id = v_coupon.id and cr.user_id = p_user_id
         group by cr.coupon_id
        having count(*) >= v_coupon.usage_limit_per_user
      ) then
        v_discount := 0;
      elsif v_coupon.discount_type = 'percentage' then
        v_discount := (v_service.price_paise * v_coupon.discount_value) / 100;
        if v_coupon.max_discount_paise is not null then
          v_discount := least(v_discount, v_coupon.max_discount_paise);
        end if;
      else
        v_discount := least(v_coupon.discount_value::bigint, v_service.price_paise);
      end if;
    end if;
  end if;

  v_net := v_service.price_paise - v_discount;
  v_tax := (v_net * greatest(p_tax_bps, 0)) / 10000;

  insert into public.appointments (
    user_id, service_id, starts_at, ends_at,
    status, payment_status,
    price_paise, discount_paise, tax_paise, total_paise, currency,
    coupon_id, service_title_snapshot, duration_minutes,
    client_question, subject_name, subject_birth_date, subject_birth_time,
    subject_birth_place, subject_birth_time_known, hold_id
  ) values (
    p_user_id, p_service_id, v_hold.starts_at, v_hold.ends_at,
    'pending_payment', 'created',
    v_service.price_paise, v_discount, v_tax,
    v_service.price_paise - v_discount + v_tax, v_service.currency,
    v_coupon.id, v_service.title, v_service.duration_minutes,
    p_client_question, p_subject_name, p_subject_birth_date, p_subject_birth_time,
    p_subject_birth_place, coalesce(p_subject_birth_time_known, true), v_hold.id
  )
  returning * into v_appt;

  update public.slot_holds
     set converted_appointment_id = v_appt.id
   where id = v_hold.id;

  if v_coupon.id is not null and v_discount > 0 then
    insert into public.coupon_redemptions (coupon_id, user_id, appointment_id, discount_paise)
    values (v_coupon.id, p_user_id, v_appt.id, v_discount)
    on conflict do nothing;

    update public.coupons set times_used = times_used + 1 where id = v_coupon.id;
  end if;

  return v_appt;

exception
  -- 23P01 = exclusion_violation, raised by appointments_no_overlap. This is
  -- layer 3 firing: someone beat us to the slot despite the hold. Translate it
  -- into a message a human can act on rather than a 500.
  when exclusion_violation then
    raise exception 'That time was just booked by someone else. Please choose another slot.'
      using errcode = 'P0001';
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
--
-- get_available_slots is intentionally public: the calendar must render for
-- anonymous visitors. Everything else is server-only and reachable solely with
-- the service-role key. Leaving these EXECUTE-able by `authenticated` would let
-- any logged-in user create appointments and holds directly against PostgREST,
-- bypassing every application-layer check.
-- ---------------------------------------------------------------------------
revoke all on function public.create_slot_hold(uuid, timestamptz, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.release_slot_hold(uuid, text) from public, anon, authenticated;
revoke all on function public.expire_stale_holds() from public, anon, authenticated;
revoke all on function public.create_pending_appointment(uuid, uuid, uuid, text, text, text, date, time, text, boolean, text, integer) from public, anon, authenticated;

grant execute on function public.get_available_slots(uuid, date, date, text) to anon, authenticated;
