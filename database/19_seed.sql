-- ============================================================================
-- 19_seed.sql — starting data
--
-- IMPORTANT
-- Every price and every line of copy below is a PLACEHOLDER, marked as such.
-- They are researched-realistic for the Indian market (docs/research.md §1.2)
-- but they are NOT Komal's actual rates. Edit them in the admin Services screen
-- before going live.
--
-- There is deliberately NO seeded testimonial data and NO seeded statistics.
-- The brief forbids fabricated social proof, and the landing page renders
-- nothing at all where real data does not yet exist.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Services  (PLACEHOLDER pricing — confirm with Komal before launch)
-- ---------------------------------------------------------------------------
insert into public.services
  (slug, title, tagline, description, highlights, ideal_for,
   price_paise, duration_minutes, buffer_minutes, mode,
   featured, sort_order, min_notice_hours, max_advance_days, free_cancellation_hours,
   seo_title, seo_description)
values
  (
    'astrological-guidance',
    'Astrological Guidance',
    'A full reading of your birth chart, and what it means for the year ahead.',
    'A detailed one-to-one session built around your birth chart. We look at the placements that shape your temperament and your timing, work through the questions you arrive with, and end with practical direction you can actually act on — not vague predictions. You will receive a written summary of the key points afterwards.',
    array[
      'Complete natal chart analysis',
      'Current and upcoming dasha periods',
      'Practical remedies suited to your situation',
      'Written summary sent after the session'
    ],
    array[
      'You are at a crossroads and want structured perspective',
      'You want to understand recurring patterns in your life',
      'You have specific questions about the next 12 months'
    ],
    210000, 45, 10, 'video',
    true, 1, 12, 60, 24,
    'Astrological Guidance & Birth Chart Reading — Astrologer Komal Kalra',
    'One-to-one Vedic astrology consultation with Komal Kalra. Detailed birth chart analysis, dasha timing and practical guidance. Book a 45-minute session online.'
  ),
  (
    'kundli-milan',
    'Kundli Milan',
    'Compatibility matching for marriage, read properly rather than reduced to a score.',
    'Traditional Ashtakoot Guna Milan alongside a genuine reading of both charts — Mangal Dosha, the emotional and financial indicators, and the timing of the match. A low guna score is not a verdict, and a high one is not a guarantee; the session explains what the charts actually show and what it means in practice for both families.',
    array[
      'Full 36-guna Ashtakoot analysis',
      'Mangal Dosha assessment and its real weight',
      'Both charts read individually, not just scored',
      'Clear guidance for the family conversation'
    ],
    array[
      'A marriage proposal is under consideration',
      'You have been given a guna score and want it explained',
      'There is concern about Mangal Dosha in either chart'
    ],
    260000, 60, 15, 'video',
    true, 2, 24, 60, 48,
    'Kundli Milan — Online Marriage Compatibility Matching | Komal Kalra',
    'Traditional Kundli Milan with full Ashtakoot Guna analysis and Mangal Dosha assessment, explained clearly. 60-minute online consultation with Komal Kalra.'
  ),
  (
    'life-coaching',
    'Life Coaching',
    'Structured coaching for a decision you keep circling back to.',
    'A working session focused on one thing you are trying to move forward — a career decision, a relationship, a change you keep postponing. This is coaching, not prediction: we map where you are, what is genuinely blocking you, and the next concrete step. Astrological context is used where it adds clarity, and set aside where it does not.',
    array[
      'Focused on one decision or transition',
      'Clear next steps agreed before the session ends',
      'Optional follow-up to check progress'
    ],
    array[
      'You know what you want but cannot start',
      'You are weighing a significant career or personal change',
      'You want accountability, not just advice'
    ],
    180000, 45, 10, 'video',
    false, 3, 12, 60, 24,
    'Life Coaching Sessions with Komal Kalra',
    'One-to-one life coaching with Komal Kalra. Structured sessions for career decisions, transitions and the changes you keep postponing.'
  ),
  (
    'healing-session',
    'Healing Session',
    'A guided session for release, grounding and emotional reset.',
    'A quieter, slower session for people carrying something heavy — grief, anxiety, a period that has not resolved. Guided energy work combined with practical grounding techniques you can continue at home. This is supportive work and complements, but does not replace, medical or psychological care.',
    array[
      'Guided energy and breath work',
      'Grounding practices to continue at home',
      'A calm, unhurried session'
    ],
    array[
      'You are moving through grief or a difficult period',
      'You feel persistently unsettled and want space to reset',
      'You want supportive practice alongside other care'
    ],
    160000, 40, 10, 'video',
    false, 4, 12, 60, 24,
    'Healing Sessions with Komal Kalra',
    'Guided healing and grounding sessions with Komal Kalra. A calm 40-minute space for release and emotional reset.'
  ),
  (
    'counselling',
    'Counselling',
    'A confidential conversation, with someone who will actually listen.',
    'An unhurried, confidential session to talk through what is happening — family matters, relationship strain, a decision you cannot discuss elsewhere. The approach is practical and non-judgemental. Where a matter needs clinical support, that will be said plainly rather than worked around.',
    array[
      'Completely confidential',
      'Unhurried — the session is not cut short',
      'Practical, non-judgemental guidance'
    ],
    array[
      'You need to talk something through in confidence',
      'Family or relationship matters are weighing on you',
      'You want perspective before making a decision'
    ],
    150000, 45, 10, 'video',
    false, 5, 12, 60, 24,
    'Confidential Counselling with Komal Kalra',
    'Confidential one-to-one counselling sessions with Komal Kalra. An unhurried, non-judgemental space to talk things through.'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Availability  (PLACEHOLDER — replace with Komal's real working hours)
-- Monday–Saturday, 10:00–13:00 and 16:00–19:00 IST. Sunday closed.
-- ---------------------------------------------------------------------------
insert into public.availability_rules (weekday, start_time, end_time, slot_interval_minutes, label)
select w, '10:00'::time, '13:00'::time, 30, 'Morning' from generate_series(1,6) w
on conflict do nothing;

insert into public.availability_rules (weekday, start_time, end_time, slot_interval_minutes, label)
select w, '16:00'::time, '19:00'::time, 30, 'Evening' from generate_series(1,6) w
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Promoting an administrator
--
-- There is NO application code path that can do this, by design. Sign up
-- normally at /login first, then run this once in the Supabase SQL editor:
--
--   update public.profiles set role = 'admin' where email = 'komal@example.com';
--
-- The SQL editor runs as the table owner and therefore bypasses both the RLS
-- policy and the protect_profile_role() trigger. Nothing else can.
-- ---------------------------------------------------------------------------
