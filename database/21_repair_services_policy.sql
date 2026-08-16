-- ============================================================================
-- 21_repair_services_policy.sql — recovery script
--
-- RUN THIS IF THE SITE SUDDENLY SHOWS NO SERVICES.
--
-- WHAT WENT WRONG
--
-- 04_services.sql gained an `internal` column and a public select policy that
-- references it. But the table is created with `create table if not exists`,
-- which is a NO-OP on a database where the table already exists — so re-running
-- that file against a live database did NOT add the column, and then:
--
--     drop policy if exists "services_select_public" …   ← succeeded
--     create policy "services_select_public" … internal … ← FAILED, 42703
--
-- The drop is not rolled back when you run a file statement-by-statement, so
-- the table was left with **no public select policy at all**. Row-level
-- security denies by default, so every anonymous read returned zero rows and
-- the catalogue vanished from the homepage, /services and the booking flow.
--
-- A second, independent version of the same fault lived in the application:
-- `.eq('internal', false)` against a database without the column returns
-- 400/42703, and the error was being discarded, so the query silently produced
-- an empty list. Both are fixed — 04 now adds the column before touching the
-- policies, and the app filters in JavaScript so it cannot depend on a column
-- that may not exist yet.
--
-- This file is idempotent and safe to run at any time, including on a database
-- that is already healthy.
-- ============================================================================

-- 1. Add the column if it is missing. Must come BEFORE any policy that
--    references it — that ordering is the whole bug.
alter table public.services
  add column if not exists internal boolean not null default false;

-- 2. Restore the public read policy.
drop policy if exists "services_select_public" on public.services;
create policy "services_select_public" on public.services
  for select using (active = true and internal = false);

-- 3. Admin policies, in case they were also lost.
drop policy if exists "services_select_admin" on public.services;
create policy "services_select_admin" on public.services
  for select using (public.is_admin());

drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Confirm the repair worked. Expect one row per policy, and a count
--    matching the number of live services.
-- ---------------------------------------------------------------------------
select policyname, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'services'
 order by policyname;

select count(*) filter (where not internal) as public_services,
       count(*) filter (where internal)     as internal_services,
       count(*)                             as total
  from public.services
 where active;
