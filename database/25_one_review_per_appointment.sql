-- ============================================================================
-- 25_one_review_per_appointment.sql
--
-- A client may leave one review per completed session.
--
-- WHY THIS IS A CONSTRAINT AND NOT AN `if exists` CHECK IN THE ACTION
--
-- The obvious version is to SELECT for an existing review and insert if there
-- is none. That is a check-then-act, and it loses the same race the booking
-- system already guards against elsewhere: two submits a few milliseconds
-- apart both see no row, and both insert. Double-clicking "Send review" on a
-- slow connection is enough to produce it.
--
-- A unique index makes the second insert fail at the database with 23505,
-- which submitTestimonial() turns into "You have already left a review for
-- this session." One statement, no window.
--
-- PARTIAL, because appointment_id is nullable: a review Komal enters herself
-- from a WhatsApp message has no appointment attached, and several NULLs must
-- not collide with each other. A plain unique index would treat them as
-- distinct in Postgres anyway, but saying so explicitly documents the intent.
--
-- Idempotent. Safe on a fresh or existing database, and safe to re-run.
-- ============================================================================

create unique index if not exists testimonials_one_per_appointment_idx
  on public.testimonials (appointment_id)
  where appointment_id is not null;

comment on index public.testimonials_one_per_appointment_idx is
  'One client review per appointment. Relied on by submitTestimonial() in '
  'src/app/dashboard/actions.ts, which maps 23505 to a readable message.';

-- ---------------------------------------------------------------------------
-- Verify: expect zero duplicates before and after.
-- ---------------------------------------------------------------------------
select appointment_id, count(*) as reviews
  from public.testimonials
 where appointment_id is not null
 group by appointment_id
having count(*) > 1;
