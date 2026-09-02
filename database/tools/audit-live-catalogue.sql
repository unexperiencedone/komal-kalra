-- ============================================================================
-- audit-live-catalogue.sql — what the PUBLIC can currently see and book
--
-- Run this before every go-live, and after any test that touched prices.
--
-- Two things were live on komal-kalra.vercel.app on 2026-09-03 that should not
-- have been, and both were invisible from the code — only the database knew:
--
--   · `test_service` was in the public catalogue, in the footer, and was the
--     DEFAULT selection on /book.
--   · `Astrological Guidance` was priced at ₹1.
--
-- /services is `index, follow`, so those were also crawlable by Google.
--
-- Neither is a bug in the application. The RLS policy and the `internal` flag
-- work exactly as designed; the rows simply were not set that way. Which is the
-- point of this file: catalogue state is data, so it needs a data-level check,
-- not a code review.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Exactly what an anonymous visitor sees. Anything listed here is public.
-- ---------------------------------------------------------------------------
select
  s.slug,
  s.title,
  (s.price_paise / 100.0)::numeric(12,2) as price_rupees,
  s.duration_minutes,
  s.active,
  s.internal,
  s.bookable_online,
  s.min_lead_days,
  case
    when s.price_paise <= 100  then '⚠️  ₹1 or less — test price still live?'
    when s.slug ~* 'test|demo|dummy|verification' then '⚠️  looks like a test row'
    else 'ok'
  end as flag
from public.services s
where s.active = true
  and coalesce(s.internal, false) = false
order by s.sort_order, s.title;

-- ---------------------------------------------------------------------------
-- 2. Anything hidden, so you can confirm it is hidden ON PURPOSE and not
--    quietly archived while you were still using it.
-- ---------------------------------------------------------------------------
select slug, title, active, internal, archived_at,
       (price_paise / 100.0)::numeric(12,2) as price_rupees
  from public.services
 where active = false or coalesce(internal, false) = true
 order by slug;

-- ============================================================================
-- FIXES — read the output above first, then run the lines you actually need.
-- Every one is commented out. Nothing here should run unexamined against a
-- live catalogue.
-- ============================================================================

-- Hide the test row from everyone, including admins, WITHOUT deleting it —
-- this is the "hide it so we can retrieve it later" behaviour from
-- 22_service_archiving.sql. Reversible: set active = true, internal = false.
--
--   update public.services
--      set active = false,
--          internal = true,
--          archived_at = now()
--    where slug = 'test';

-- Restore the real price of the guidance consultation. CHECK THE INTENDED
-- FIGURE FIRST — this is stored in paise, so ₹2,100 is 210000.
--
--   update public.services
--      set price_paise = 210000
--    where slug = 'astrological-guidance';

-- Live payment testing should use the dedicated ₹1 row from
-- 20_verification_service.sql, which is `internal = true` and therefore
-- invisible to the public, rather than repricing a real service:
--
--   update public.services
--      set active = true, internal = true
--    where slug = 'guidance-verification';

-- ---------------------------------------------------------------------------
-- 3. Re-run section 1 afterwards. The `flag` column should read `ok` on every
--    remaining row.
-- ---------------------------------------------------------------------------
