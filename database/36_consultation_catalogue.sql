-- ============================================================================
-- 36_consultation_catalogue.sql — the real fee sheet replaces the placeholders
--
-- WHAT THIS CHANGES
--
-- 19_seed.sql shipped five TOPIC services — Astrological Guidance, Kundli
-- Milan, Life Coaching, Healing Session, Counselling — and said so in its own
-- header: "Every price and every line of copy below is a PLACEHOLDER". They
-- were never Komal's rates. They have been on the public site ever since.
--
-- The practice's actual published fee sheet is five TIERS, not five topics:
--
--   Astrologer Sunil Sharma   30 min, by phone            ₹2,100
--   Astrologer Komal Kalra    25 min, by phone            ₹3,100
--   Astrologer Komal Kalra    40 min, by phone            ₹5,100
--   Astrologer Komal Kalra    In-depth Kundli, 60 min     ₹11,000
--   Astrologer Komal Kalra    Family pack, four members   ₹21,000
--
-- This migration archives the placeholders and inserts the fee sheet as the
-- live catalogue. Everything that reads `services` — the homepage bento, the
-- About grid, the header and footer navigation, /services, /services/<slug>,
-- the sitemap and the booking flow — follows automatically, because all of
-- them already go through getActiveServices() / getServiceBySlug().
--
-- ---------------------------------------------------------------------------
-- WHY ARCHIVE AND NOT DELETE
-- ---------------------------------------------------------------------------
--
-- appointments and payments reference services with ON DELETE RESTRICT. Any
-- past booking against a placeholder service would have to be destroyed along
-- with it, and a payment row that no longer matches what Razorpay holds is
-- worse than an untidy table is good. 22_service_archiving.sql exists for
-- exactly this: archived_at records when a row was retired, active = false
-- takes it off the public site through the EXISTING select policy, and
-- nothing is lost.
--
-- Restoring any of them is `update … set archived_at = null, active = true`.
--
-- ---------------------------------------------------------------------------
-- WHY THIS MIGRATION TOUCHES NO POLICY
-- ---------------------------------------------------------------------------
--
-- The public select policy is already `active = true and internal = false`,
-- so archived rows are excluded by a rule that does not have to change. That
-- is deliberate and it is the lesson of 21_repair_services_policy.sql and
-- 35_repair_service_columns.sql: a migration that drops and recreates the
-- catalogue's select policy can leave the table with NO public read policy and
-- empty the entire site. This one does not go near it.
--
-- ---------------------------------------------------------------------------
-- TWO HONEST COMPROMISES, STATED RATHER THAN HIDDEN
-- ---------------------------------------------------------------------------
--
-- 1. THE FAMILY PACK HAS NO STATED SESSION LENGTH on the fee sheet, but
--    services.duration_minutes is NOT NULL (check: 5–480) because the slot
--    engine schedules against it. It is set to 90 here as a SCHEDULING figure
--    and the row is marked bookable_online = false, so no slot is ever held
--    against it and no visitor is ever quoted that number as a promise — the
--    detail page routes them to /contact instead. The published fee card on
--    /services still prints no duration at all for this package, because that
--    card renders from src/lib/content/packages.ts where the value is null.
--
-- 2. THE FAMILY PACK HAS NO STATED FORMAT either, and services.mode is NOT
--    NULL. 'video' is recorded because the in-depth Kundli work it contains is
--    delivered on screen, and serviceLogistics() turns that into "held over a
--    secure video link" — which is what the practice does. If that is wrong,
--    change this one value; nothing else depends on it.
--
-- Prices are paise, like every monetary value in this schema. ₹2,100 = 210000.
--
-- Idempotent. Safe to re-run: the archive is keyed on slug, and the insert
-- upserts on the unique slug so re-running refreshes copy rather than failing.
--
-- ⚠️  RUN THE WHOLE FILE IN ONE GO, as one statement batch.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Retire the placeholder catalogue.
--
-- Listed by slug rather than "everything that is not new", so a service added
-- deliberately in the admin console since launch is left alone, and so is the
-- ₹1 internal verification service.
-- ---------------------------------------------------------------------------
update public.services
   set archived_at = coalesce(archived_at, now()),
       active      = false
 where slug in (
         'astrological-guidance',
         'kundli-milan',
         'life-coaching',
         'healing-session',
         'counselling'
       );


-- ---------------------------------------------------------------------------
-- 2. Insert the published fee sheet.
--
-- sort_order follows the fee sheet's own order — ascending by price, Sunil's
-- session first. It is an editorial sequence, not a computed one.
--
-- min_lead_days / min_notice_hours match what 34_seven_days_one_day_lead.sql
-- set across the catalogue ("anything from tomorrow"), so these rows do not
-- silently reintroduce the three-day rule that migration removed.
-- ---------------------------------------------------------------------------
insert into public.services
  (slug, title, tagline, description, highlights, ideal_for,
   price_paise, duration_minutes, buffer_minutes, mode,
   active, bookable_online, featured, sort_order,
   min_notice_hours, min_lead_days, max_advance_days, free_cancellation_hours,
   seo_title, seo_description)
values
  (
    'consultation-30-sunil',
    '30-Minute Consultation',
    'A half-hour reading with Astrologer Sunil Sharma, by phone.',
    'A focused half-hour on the telephone with Astrologer Sunil Sharma. You bring the question you actually have — a decision, a period that will not settle, a timing you want checked — and he reads what the chart says about it and answers plainly. Thirty minutes is enough for one matter taken properly; it is not a full life reading, and he will say so if that is what your question needs.',
    array[
      'One-to-one with Astrologer Sunil Sharma',
      'Held over the telephone',
      'Built around the question you arrive with',
      'Plain answers, including when the answer is to wait'
    ],
    array[
      'You have one specific question and want it answered well',
      'You want a second reading alongside an earlier consultation',
      'You would rather start short before booking a longer session'
    ],
    210000, 30, 10, 'phone',
    true, true, false, 1,
    0, 1, 60, 24,
    '30-Minute Astrology Consultation with Astrologer Sunil Sharma',
    'A focused 30-minute telephone consultation with Astrologer Sunil Sharma. One question, read properly, answered plainly. ₹2,100. Book online.'
  ),
  (
    'consultation-25',
    '25-Minute Consultation',
    'A short, direct session with Komal Kalra, by phone.',
    'Twenty-five minutes on the telephone with Komal. This is the session for one matter you want read and answered now — whether to take the offer, whether the timing is right, what the period you are in is actually about. Komal reads the chart in advance, so the time on the call goes on your question rather than on setting up. Nothing is added afterwards and nothing is upsold on the call.',
    array[
      'One-to-one with Komal Kalra',
      'Held over the telephone',
      'Chart read in advance so the call is spent on your question',
      'Fixed fee — nothing added afterwards'
    ],
    array[
      'You have a single decision in front of you',
      'You want a clear read without a long session',
      'You have consulted before and need one thing checked'
    ],
    310000, 25, 10, 'phone',
    true, true, true, 2,
    0, 1, 60, 24,
    '25-Minute Astrology Consultation — Astrologer Komal Kalra',
    'A direct 25-minute telephone consultation with Komal Kalra. One matter, read from your chart and answered plainly. ₹3,100. Book online.'
  ),
  (
    'consultation-40',
    '40-Minute Consultation',
    'A longer working session with Komal Kalra, by phone.',
    'Forty minutes on the telephone — the session for when there is more than one thing, or when one thing has several parts. Career and the move that depends on it; a marriage question and the family conversation around it; a run of years that has not gone the way it should. Komal reads the chart beforehand and the call moves from what it shows, to what it means for you now, to what you do about it before the next period turns.',
    array[
      'One-to-one with Komal Kalra',
      'Held over the telephone',
      'Room for several connected questions, not just one',
      'Ends on specifics: what to act on and what to wait out'
    ],
    array[
      'Several parts of your life are moving at once',
      'You want the reasoning, not only the conclusion',
      'A short session has already told you there is more to cover'
    ],
    510000, 40, 10, 'phone',
    true, true, true, 3,
    0, 1, 60, 24,
    '40-Minute Astrology Consultation — Astrologer Komal Kalra',
    'A 40-minute telephone consultation with Komal Kalra for several connected questions. Chart read in advance, clear direction at the end. ₹5,100.'
  ),
  (
    'in-depth-kundli',
    'In-Depth Kundli Consultation',
    'A full hour on screen, with your chart open and the Kundli PDF to keep.',
    'The complete reading. An hour on video with your Kundli on screen in front of both of you — placements, house emphasis, the dasha and antardasha currently running and what comes after them. Komal works through the chart live rather than reporting conclusions from notes, so you see what she is reading and why it means what she says it means. You keep the full Kundli PDF afterwards.',
    array[
      'Live prediction on screen — you see the chart being read',
      'Complete natal analysis with current and upcoming dasha periods',
      'Kundli PDF included, yours to keep',
      'A full hour, on video'
    ],
    array[
      'You want the whole chart read, not one question answered',
      'You are at a genuine crossroads and want the full picture',
      'You want a document to return to long after the session'
    ],
    1100000, 60, 15, 'video',
    true, true, true, 4,
    0, 1, 60, 48,
    'In-Depth Kundli Consultation — Full Birth Chart Reading | Komal Kalra',
    'A 60-minute in-depth Kundli consultation with Komal Kalra on video. Live chart reading on screen, full dasha analysis, Kundli PDF included. ₹11,000.'
  ),
  (
    'family-pack',
    'Family Pack',
    'Individual Kundli analysis for four members, with a PDF for each.',
    'One engagement covering four members of a family, each with their own Kundli analysed individually rather than as a footnote to someone else''s chart. Every member receives their own Kundli PDF. This is the arrangement families take when a marriage, a move or a business decision affects everyone in the house and each chart needs reading on its own terms before the conversation can be had properly. Timings are arranged directly — get in touch and Komal will set it out.',
    array[
      'Individual Kundli analysis for each member',
      'Kundli PDF included for every member',
      'Covers four members',
      'Sessions arranged directly rather than booked online'
    ],
    array[
      'A decision in front of you affects the whole household',
      'A marriage proposal needs more than two charts read',
      'You would rather arrange one engagement than four bookings'
    ],
    2100000, 90, 15, 'video',
    -- bookable_online = false: the fee sheet states no session length, so this
    -- package is arranged in conversation. The detail page's CTA becomes
    -- "Enquire About This Service" and points at /contact. See the header.
    true, false, false, 5,
    0, 1, 60, 48,
    'Family Pack — Kundli Analysis for Four Members | Komal Kalra',
    'Individual Kundli analysis for four family members with a PDF for each, by Astrologer Komal Kalra. ₹21,000. Enquire to arrange.'
  )
on conflict (slug) do update set
  title                   = excluded.title,
  tagline                 = excluded.tagline,
  description             = excluded.description,
  highlights              = excluded.highlights,
  ideal_for               = excluded.ideal_for,
  price_paise             = excluded.price_paise,
  duration_minutes        = excluded.duration_minutes,
  buffer_minutes          = excluded.buffer_minutes,
  mode                    = excluded.mode,
  active                  = excluded.active,
  bookable_online         = excluded.bookable_online,
  featured                = excluded.featured,
  sort_order              = excluded.sort_order,
  min_notice_hours        = excluded.min_notice_hours,
  min_lead_days           = excluded.min_lead_days,
  max_advance_days        = excluded.max_advance_days,
  free_cancellation_hours = excluded.free_cancellation_hours,
  seo_title               = excluded.seo_title,
  seo_description         = excluded.seo_description,
  -- A row that was archived in an earlier run and is being re-seeded here is
  -- deliberately brought back: the slugs above ARE the live catalogue.
  archived_at             = null;


-- ---------------------------------------------------------------------------
-- 3. Verify.
--
-- The first query is what the public site will show. The second is what was
-- retired. If the first returns anything other than the five rows above — or
-- the second returns something you did not expect to lose — stop and look
-- before deploying.
-- ---------------------------------------------------------------------------
select slug, title, price_paise, duration_minutes, mode, bookable_online, sort_order
  from public.services
 where active = true
   and internal = false
   and archived_at is null
 order by sort_order;

select slug, title, archived_at
  from public.services
 where archived_at is not null
 order by archived_at desc, slug;
