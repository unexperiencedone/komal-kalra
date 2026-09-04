-- ============================================================================
-- 34_seven_days_one_day_lead.sql
--
-- Two changes, both requested by the practice:
--   · bookings open EVERY day of the week
--   · lead time drops from three days to ONE — book today, earliest is tomorrow
--
-- ---------------------------------------------------------------------------
-- WHY min_notice_hours ALSO HAS TO MOVE
-- ---------------------------------------------------------------------------
--
-- get_available_slots() takes the LATER of two floors: `now() + min_notice_hours`
-- and midnight of `today + min_lead_days`. At three days the day rule always
-- won and the 12-hour notice never mattered. At one day it does:
--
--   Booking at 9pm on the 4th, min_lead_days = 1, min_notice_hours = 12
--     day rule    -> 5 Sep 00:00
--     hours rule  -> 5 Sep 09:00   <- later, so this wins
--   Result: the whole morning of the 5th silently disappears.
--
-- The practice asked for "24 hours or one day", meaning tomorrow is bookable.
-- Leaving the 12-hour notice in place would deliver something quietly narrower
-- than that, and only for people booking in the evening — the hardest kind of
-- bug to notice, because the calendar still looks full of options.
--
-- So min_notice_hours goes to 0 and min_lead_days carries the rule alone. One
-- knob, one behaviour, explainable on the phone: "anything from tomorrow".
--
-- Idempotent. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lead time
-- ---------------------------------------------------------------------------
update public.services
   set min_lead_days   = 1,
       min_notice_hours = 0
 where coalesce(internal, false) = false;

-- The ₹1 verification service stays bookable today — it exists so Komal can
-- push a live payment through and watch it settle, which a lead time defeats.
update public.services
   set min_lead_days = 0, min_notice_hours = 0
 where slug = 'guidance-verification';

-- ---------------------------------------------------------------------------
-- 2. Seven-day availability
--
-- weekday follows Postgres `extract(dow)`: 0 = Sunday … 6 = Saturday, which is
-- what get_available_slots() compares against. Do not renumber.
--
-- 10:00–18:00 with 30-minute starts is carried over from the existing weekday
-- rules so nothing about the working day changes except which days exist.
-- Komal can edit any of these in Admin → Availability afterwards; this only
-- guarantees no day is missing.
-- ---------------------------------------------------------------------------
insert into public.availability_rules (weekday, start_time, end_time, slot_interval_minutes, active, label)
select d.weekday, time '10:00', time '18:00', 30, true, 'Standard day'
  from (select generate_series(0, 6) as weekday) d
 where not exists (
   select 1 from public.availability_rules r
    where r.weekday = d.weekday and r.active = true
 );

-- Anything already switched off is switched back on — a day left inactive from
-- earlier testing would otherwise silently stay closed.
update public.availability_rules set active = true where active = false;

-- ---------------------------------------------------------------------------
-- Verify.
--
-- Expect: seven rows, one per weekday; and a first bookable slot on TOMORROW
-- for every public service.
-- ---------------------------------------------------------------------------
select weekday,
       to_char(date '2024-01-07' + weekday, 'Day') as day_name,
       start_time, end_time, active
  from public.availability_rules
 order by weekday, start_time;

select s.slug,
       s.min_lead_days,
       s.min_notice_hours,
       (now() at time zone public.business_timezone())::date as today_ist,
       min(g.slot_start) as first_bookable
  from public.services s
  left join lateral public.get_available_slots(
         s.id,
         (now() at time zone public.business_timezone())::date,
         (now() at time zone public.business_timezone())::date + 9,
         null
       ) g on true
 where s.active = true
 group by s.slug, s.min_lead_days, s.min_notice_hours
 order by s.slug;
