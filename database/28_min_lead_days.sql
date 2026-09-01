-- ============================================================================
-- 28_min_lead_days.sql — "bookings open two clear days from now"
--
-- THE RULE, stated the way the client stated it: if I start a booking on
-- 1 September, the earliest session I can choose is 4 September. The 2nd and
-- the 3rd are both excluded — two clear days — so the earliest bookable DATE is
-- today + 3.
--
-- WHY THE COLUMN STORES 3 AND NOT 2
--
-- "Two clear days" and "three days from today" are the same rule, but only one
-- of them can be written without an off-by-one. If the column held 2, every
-- reader of this code would have to remember a `+ 1` that looks like a bug and
-- gets "tidied away" by the next person. So the column means exactly what it
-- says: THE EARLIEST BOOKABLE DATE IS TODAY PLUS THIS MANY DAYS. Set it to 3
-- and you get the client's rule. The admin UI does the translating.
--
-- WHY THIS IS NOT min_notice_hours = 72
--
-- min_notice_hours already exists and is a ROLLING window from `now()`. At 72
-- hours it produces a rule nobody can explain on the phone: a booking made on
-- 1 September at 11pm may take 4 September at 11pm but NOT 4 September at
-- 10am — the same calendar date is half available and half not, and which half
-- depends on what time of day the visitor happened to open the site.
--
-- The client's rule is about calendar dates, so this is computed against the
-- calendar date in Asia/Kolkata. A visitor booking at 11:55pm and one booking
-- five minutes later see different answers only because the date genuinely
-- rolled over, which is the behaviour anyone would predict.
--
-- BOTH LIMITS STILL APPLY. The effective floor is the LATER of the two, so
-- neither can be silently bypassed by relaxing the other. With the defaults
-- (3 days / 12 hours) the day rule always wins; min_notice_hours is kept for a
-- service that might one day want same-week bookings with an hours-based cut.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.services
  add column if not exists min_lead_days integer not null default 3
  check (min_lead_days >= 0 and min_lead_days <= 365);

comment on column public.services.min_lead_days is
  'The earliest bookable date is (today in Asia/Kolkata) + this many days. '
  '3 = the client''s "two clear days" rule: book on the 1st, earliest session '
  'is the 4th. 0 = bookable today. Enforced in get_available_slots().';

-- ---------------------------------------------------------------------------
-- The verification service is exempt.
--
-- database/20_verification_service.sql exists so Komal can put ₹1 through the
-- live Razorpay account and watch it settle. A three-day wait before she can
-- test a payment would make it useless for the one job it has.
-- ---------------------------------------------------------------------------
update public.services set min_lead_days = 0 where slug = 'guidance-verification';

-- ---------------------------------------------------------------------------
-- get_available_slots — replaced wholesale.
--
-- Only the v_min_start calculation changes; the rest is byte-identical to
-- 16_functions_booking.sql. It is repeated in full rather than patched because
-- CREATE OR REPLACE FUNCTION has no partial form, and because a reader landing
-- on this file needs to see the whole function they are actually running.
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
  v_earliest_date date;
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

  -- Midnight, in the business timezone, of the first bookable date. Note the
  -- cast order: `(date)::timestamp at time zone tz` reads a LOCAL wall-clock
  -- midnight and converts it to an instant. Writing it the other way round
  -- would interpret midnight as UTC and shift the whole rule by 5h30m — which
  -- would quietly make the small hours of the previous date bookable.
  v_earliest_date := ((now() at time zone tz)::date + coalesce(v_service.min_lead_days, 0));

  v_min_start := greatest(
    now() + make_interval(hours => v_service.min_notice_hours),
    (v_earliest_date::timestamp at time zone tz)
  );
  v_max_start := now() + make_interval(days => v_service.max_advance_days);

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

grant execute on function public.get_available_slots(uuid, date, date, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verify.
--
-- Nothing enforces this rule anywhere else: create_slot_hold re-checks
-- availability by calling get_available_slots INSIDE its advisory lock, and
-- create_pending_appointment can only build an appointment from a live hold.
-- So changing this one function closes the calendar, the hold and the booking
-- at once — there is no second path that needs the same edit.
--
-- Expect: no slot earlier than three days from today for any normal service.
-- ---------------------------------------------------------------------------
select s.slug,
       s.min_lead_days,
       (now() at time zone public.business_timezone())::date as today_ist,
       min(g.slot_start) as first_bookable
  from public.services s
  left join lateral public.get_available_slots(
         s.id,
         (now() at time zone public.business_timezone())::date,
         (now() at time zone public.business_timezone())::date + 14,
         null
       ) g on true
 where s.active = true
 group by s.slug, s.min_lead_days
 order by s.slug;
