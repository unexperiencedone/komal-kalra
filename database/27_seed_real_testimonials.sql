-- ============================================================================
-- 27_seed_real_testimonials.sql
--
-- The first real testimonials. Supplied by Komal on 2026-08-28: five WhatsApp
-- messages from named clients, and four reviews already public on her Google
-- Business listing.
--
-- THIS IS NOT A CONTRADICTION OF 12_testimonials.sql. That file says there is
-- no seeded testimonial data, and the rule behind it was never "no seed file" —
-- it was "nothing invented". Every word below was written by a client. The rule
-- that still stands, and that this file does not touch, is that the site shows
-- nothing when there is nothing: no placeholder review text exists anywhere in
-- the codebase, and the components still render null on an empty list.
--
-- TEXT IS VERBATIM.
--
-- The Punjabi and Hinglish messages are reproduced exactly as sent — spelling,
-- grammar and all. Polishing them into fluent English would be rewriting a
-- client's words and putting the result in their mouth under their real name,
-- which is fabrication with extra steps. It would also read as invented, since
-- nine reviews in identical prose is what a made-up testimonial section looks
-- like. The only edits are decorative emoji removed and one missing space
-- ("100%correct" → "100% correct").
--
-- RATINGS. The Google rows carry 5 because the reviewer actually clicked five
-- stars and the screenshot shows it. The WhatsApp rows carry NULL because those
-- clients never rated anything — see 26_testimonial_source.sql. Do not
-- "complete" the data by filling these in.
--
-- APPROVED ON INSERT. These come from Komal directly rather than through the
-- moderation queue, so they are already her decision; making her re-approve her
-- own submissions would be theatre. approved_by is NULL because no admin
-- account performed the action — a real FK to a real person would be a lie
-- about who clicked what.
--
-- IDEMPOTENT via fixed UUIDs and ON CONFLICT DO NOTHING. Re-running this file
-- cannot produce duplicates, and any edit Komal makes in /admin/testimonials
-- survives a re-run rather than being reverted.
--
-- REQUIRES 26_testimonial_source.sql to have run first.
-- ============================================================================

insert into public.testimonials
  (id, author_name, author_location, review, rating, source,
   approved, featured, sort_order, display_initials_only)
values

-- ---------------------------------------------------------------------------
-- Google Business listing — public, attributed, verifiable by anyone.
-- These lead, because a visitor can go and check them.
-- ---------------------------------------------------------------------------

('a5710000-0000-4000-8000-000000000001',
 'Prabhjot Kaur Sandhu', null,
 $$I had a truly wonderful experience with Dr. Kalra. The guidance provided by her was incredibly accurate, insightful, and thoughtfully explained in a way that felt both personal and practical. Every detail of the reading reflected deep knowledge and genuine intuition, and the predictions resonated strongly with my real-life situations. I highly recommend Dr. Kalra to anyone seeking reliable, meaningful, and empowering astrological guidance.$$,
 5, 'google', true, true, 10, false),

('a5710000-0000-4000-8000-000000000002',
 'Chandan Bhateja', null,
 $$I had a truly enlightening experience with Dr. Komal Kalra. Her deep knowledge of Vedic astrology, combined with a compassionate and practical approach, made my consultation incredibly valuable. She took the time to listen patiently and offered insights that were accurate, thoughtful, and aligned with my current life situations. I left the session with clarity, direction, and a sense of peace. Highly recommended to anyone seeking genuine guidance rooted in ancient wisdom.$$,
 5, 'google', true, false, 20, false),

-- ---------------------------------------------------------------------------
-- WhatsApp — sent to Komal directly. Placed third so a visitor meets a real
-- client voice, in the language most of her clients actually speak, before the
-- page settles into four paragraphs of polished English.
-- ---------------------------------------------------------------------------

('a5710000-0000-4000-8000-000000000003',
 'Bhushan Kamboj', null,
 $$SSA ji ..Komal Mam to session le ke bht positivity aye tension ghat hoe bht kuch life bare sikhan to Milyea ohna to bht positive aura hai ..te sara kuch Shi dasyea ohna ne mere bare Mam to guidance le ke ek shi rashta milyea confused c bht phele thankyou so much Mam$$,
 null, 'whatsapp', true, false, 30, false),

('a5710000-0000-4000-8000-000000000004',
 'Kiran Gill', null,
 $$I had a wonderful experience with Astrologer Dr.Komal Kalra. She is very knowledgeable, kind, and genuinely cares about helping people. The guidance she gave me was clear, accurate, and truly helpful for my personal situation. I felt very comfortable and supported throughout the consultation. Highly recommend her services to anyone looking for honest and reliable astrology advice!$$,
 5, 'google', true, false, 40, false),

('a5710000-0000-4000-8000-000000000005',
 'Sukhwinder Ji', null,
 $$Mam tuhada nature bht vdia va jdo vi gal karde oh sab sach hunda oh sab so trust bht jayada va bht vdia lagda gal kr k mam and bht vdia way nal sab kuj samjone oh avoid krde jo vi tuhanu sab pta lagda mam so dil nu skoon milda tuhade nal avde life related and age future related gal kr k so baba ji mehar karn tuhade tai vi mam always jo vi attach nai sab dai kam shi hon and last thank u so much for eveything$$,
 null, 'whatsapp', true, false, 50, false),

('a5710000-0000-4000-8000-000000000006',
 'Raj Dhillon', null,
 $$I had a wonderful experience with Komal Mam.She have such a calm and gentle presence, which immediately made me feel at ease. Their insights were thoughtful, clear, and surprisingly accurate. I appreciated how patiently they explained everything, and I never felt rushed or judged. It was a peaceful and enlightening session, and I left feeling more grounded and hopeful. Highly recommend for anyone looking for a kind and intuitive astrologer.$$,
 5, 'google', true, false, 60, false),

('a5710000-0000-4000-8000-000000000007',
 'Jassie Gill', null,
 $$Ssa mam. Bahutt acha laga apse batt karke app ne bahutt achi advise di. Gud educated mam good bless you$$,
 null, 'whatsapp', true, false, 70, false),

('a5710000-0000-4000-8000-000000000008',
 'Yukti Ji', null,
 $$Mam apne jo mera prediction kiya vo 100% correct tha. Thanku so much$$,
 null, 'whatsapp', true, false, 80, false),

('a5710000-0000-4000-8000-000000000009',
 'Shaminder Ji', null,
 $$Thanku so much mam nyc to talk to you. Thanks for your guidance, bauht Vadia nature tuhada$$,
 null, 'whatsapp', true, false, 90, false)

on conflict (id) do nothing;

-- approved_at is set separately and only where it is still empty, so a re-run
-- does not overwrite the real approval timestamp of anything Komal has since
-- unpublished and re-approved by hand.
update public.testimonials
   set approved_at = now()
 where approved = true
   and approved_at is null;

-- ---------------------------------------------------------------------------
-- Verify: expect 9 rows, 4 google (all rated), 5 whatsapp (none rated).
-- ---------------------------------------------------------------------------
select source,
       count(*)        as rows,
       count(rating)   as with_rating,
       count(*) filter (where approved) as approved
  from public.testimonials
 group by source
 order by source;
