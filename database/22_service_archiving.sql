-- ============================================================================
-- 22_service_archiving.sql — retire a service without destroying it
--
-- THE PROBLEM THIS SOLVES
--
-- A service used for testing clutters the admin console forever. Deleting it
-- is the obvious answer and usually the wrong one: appointments and payments
-- reference it with ON DELETE RESTRICT, so removing it means destroying the
-- payment records too, and a payment row that no longer matches what Razorpay
-- holds is worse than a tidy services list is good.
--
-- Archiving keeps everything and simply stops showing it.
--
--   active = false     hidden from the public site, still listed in /admin
--   internal = true    bookable, absent from the public catalogue
--   archived_at set    gone from the admin list too, restorable in one click
--
-- Restoring is `archived_at = null`. Nothing was lost, so nothing has to be
-- rebuilt — the slug, price, copy, and every past booking are exactly as they
-- were. That is the point: when you come back to test the payment flow next
-- year, you un-archive rather than recreate.
--
-- ---------------------------------------------------------------------------
-- NOTE ON WHY THIS MIGRATION TOUCHES NO POLICY
--
-- Archiving always sets active = false as well, and the public select policy
-- is already `active = true and internal = false`. So archived rows are
-- excluded by a policy that does not have to change.
--
-- That is not an accident. The `internal` migration dropped and recreated this
-- policy, the recreate failed because the column it referenced had not been
-- added yet, and the site lost its entire catalogue. A migration that adds a
-- column and leaves the policies alone cannot fail that way.
--
-- Idempotent. Safe on a fresh or existing database, and safe to re-run.
-- ============================================================================

alter table public.services
  add column if not exists archived_at timestamptz;

comment on column public.services.archived_at is
  'When the service was retired from the admin console. NULL means live. '
  'Archiving also sets active = false; restoring clears this and leaves '
  'active = false so the service must be switched on deliberately.';

-- Partial index: archived rows are the rare case and the admin list filters
-- on "not archived" on every page load.
create index if not exists services_not_archived_idx
  on public.services (sort_order)
  where archived_at is null;


-- ---------------------------------------------------------------------------
-- Manual use, if you would rather not click:
--
--   -- archive
--   update public.services
--      set archived_at = now(), active = false
--    where slug = 'test_service';
--
--   -- restore (stays hidden until you tick Active)
--   update public.services
--      set archived_at = null
--    where slug = 'test_service';
--
--   -- what is archived
--   select slug, title, archived_at
--     from public.services
--    where archived_at is not null
--    order by archived_at desc;
-- ---------------------------------------------------------------------------
