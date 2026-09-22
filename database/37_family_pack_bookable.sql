-- ============================================================================
-- 37_family_pack_bookable.sql — the family pack joins the booking flow
--
-- WHAT THIS REVERSES, AND WHY
--
-- 36_consultation_catalogue.sql published the family pack with
-- bookable_online = false. The reasoning was that the fee sheet states no
-- session length for it, so it should be arranged in conversation rather than
-- have a slot picked against a duration nobody promised.
--
-- That was the wrong trade. The practice wants it in the list, and the
-- objection does not survive contact with how this site actually books:
-- NEXT_PUBLIC_BOOKING_MODE is `whatsapp`, so NOTHING on /book reserves a slot
-- or takes money. The flow fills in a WhatsApp message and the practice
-- replies to confirm the time — which is exactly "arranged in conversation".
-- Marking it enquiry-only did not add a conversation; it only removed the
-- package from the one screen where people choose what they want, and sent
-- them to a contact form that collects less than the booking form does.
--
-- THE DURATION IS STILL NOT SHOWN TO ANYONE
--
-- duration_minutes stays 90. It is a SCHEDULING figure: services.duration_
-- minutes is NOT NULL because the slot engine reads it, and 90 is what the
-- calendar blocks out. It is not quoted to the client anywhere —
-- src/lib/content/practitioners.ts exposes hasStatedDuration(), which is false
-- for this slug alone, and the booking card and the booking summary both print
-- "Four members" where every other consultation prints its length.
--
-- So the row is bookable and the fee sheet is still not made to say something
-- it does not say.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

update public.services
   set bookable_online = true
 where slug = 'family-pack';

-- ---------------------------------------------------------------------------
-- Verify: all five consultations should now read `online = true`.
-- ---------------------------------------------------------------------------
select slug, title, price_paise, duration_minutes, bookable_online, sort_order
  from public.services
 where active = true
   and internal = false
   and archived_at is null
 order by sort_order;
