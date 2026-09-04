-- ============================================================================
-- 35_repair_service_columns.sql — add the service columns this database lacks
--
-- WHAT HAPPENED
--
-- 34_seven_days_one_day_lead.sql failed with:
--
--     ERROR: 42703: column "internal" does not exist
--
-- `services.internal` and `services.archived_at` are declared in
-- 04_services.sql, but that file opens with `create table if not exists`. On a
-- database created BEFORE those columns were added to the file, re-running it
-- is a silent no-op — the table already exists, so the new columns are never
-- created and no error is raised. Migrations 20 and 21 add them properly with
-- `alter table … add column if not exists`, and neither has been run here.
--
-- This is the same failure that once emptied the entire public catalogue: a
-- policy referencing `internal` was created against a table that did not have
-- it, leaving no working select policy and no services on the site. The lesson
-- was written into src/lib/booking/availability.ts at the time — columns get
-- added with ALTER, never by editing a `create table if not exists`.
--
-- WHAT ELSE IS BROKEN WITHOUT THESE
--
--   · test_service cannot be hidden — the archiving flow needs archived_at
--     and internal, which is why it is still in the public catalogue.
--   · database/tools/audit-live-catalogue.sql fails the same way.
--   · getInternalServices() returns nothing, so the ₹1 verification service is
--     invisible to admins in the booking flow. (It degrades safely — that was
--     designed for — but it does not work.)
--
-- Running 20, 21 and 22 in order would also fix this and is the tidier path.
-- This file exists so the columns can be restored on their own, without also
-- re-seeding the verification service or recreating policies, on a database
-- whose state is uncertain.
--
-- Idempotent. Safe to run before or after 20/21/22, and safe to re-run.
--
-- ⚠️  RUN THE WHOLE FILE IN ONE GO. Do not execute it statement by statement.
--
-- The policy below is DROPPED and then recreated. If the drop runs and the
-- create does not — which is what happens if you select and run only part of
-- this file — the services table is left with no public select policy at all
-- and the entire catalogue vanishes from the site. That is not hypothetical;
-- it is precisely how it happened last time, and 21_repair_services_policy.sql
-- exists because of it. Run as one statement batch so a failure rolls the drop
-- back with it.
-- ============================================================================

alter table public.services
  add column if not exists internal boolean not null default false,
  add column if not exists archived_at timestamptz;

comment on column public.services.internal is
  'Bookable, but absent from the public catalogue — staff-only rows such as the '
  '₹1 payment verification service. Enforced by RLS, not by application code.';

comment on column public.services.archived_at is
  'When the service was retired from the admin console. NULL = live. Archiving '
  'also sets active = false, so archived rows are already excluded from the '
  'public catalogue by the existing policy.';

-- ---------------------------------------------------------------------------
-- Rebuild the public select policy so it accounts for `internal`.
--
-- Without this the column exists but nothing reads it, and an internal service
-- would still be listed publicly. Written to match 21_repair_services_policy
-- .sql so running that afterwards is a no-op rather than a conflict.
-- ---------------------------------------------------------------------------
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public" on public.services
  for select using (active = true and internal = false);

-- ---------------------------------------------------------------------------
-- Verify: the columns exist, and nothing internal is publicly visible.
-- ---------------------------------------------------------------------------
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'services'
   and column_name in ('internal', 'archived_at', 'min_lead_days', 'min_notice_hours')
 order by column_name;

select slug, title, active, internal, archived_at
  from public.services
 order by sort_order, title;
