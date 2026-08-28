-- ============================================================================
-- 26_testimonial_source.sql — record WHERE a review came from
--
-- Until now every testimonial was assumed to be a review left on this site by a
-- signed-in client after a completed session. Most of Komal's real praise is
-- not that: it arrived as WhatsApp messages, or was left publicly on her Google
-- Business listing. Those are genuine and worth showing, but they are not the
-- same kind of evidence, and the database should say so rather than flattening
-- all three into one indistinguishable pile.
--
-- WHY `rating` BECOMES NULLABLE
--
-- A WhatsApp message has no star rating. The client never gave one. Storing a 5
-- against it would be inventing a number the person did not supply — and the
-- moment anyone adds a "4.9 average from 40 reviews" badge, that invented
-- number becomes a published statistic. The brief rules out exactly that.
--
-- NULL means "this person never rated us", which is true, and any future
-- average must then decide out loud whether to count it.
--
-- The site's own review form is UNAFFECTED: the CHECK below still requires a
-- rating whenever source = 'site', so ReviewForm cannot start submitting
-- ratingless reviews by accident.
--
-- Idempotent, and safe to re-run.
-- ============================================================================

alter table public.testimonials
  add column if not exists source text not null default 'site';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'testimonials_source_check'
  ) then
    alter table public.testimonials
      add constraint testimonials_source_check
      check (source in ('site', 'whatsapp', 'google'));
  end if;
end $$;

alter table public.testimonials alter column rating drop not null;

-- A review left through our own form must still carry a rating. Without this,
-- dropping NOT NULL would quietly relax the site form too.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'testimonials_site_rating_check'
  ) then
    alter table public.testimonials
      add constraint testimonials_site_rating_check
      check (source <> 'site' or rating is not null);
  end if;
end $$;

comment on column public.testimonials.source is
  'site = left through the review form by a signed-in client after a completed '
  'session. whatsapp = a message a client sent Komal directly, entered by an '
  'admin. google = copied from the public Google Business listing. Displayed to '
  'visitors, because "a client messaged this" and "this is public on Google" '
  'are different claims.';

comment on column public.testimonials.rating is
  'NULL where the client never gave a star rating — a WhatsApp message has no '
  'stars. Do not backfill this with 5s; see 26_testimonial_source.sql.';

-- ---------------------------------------------------------------------------
-- Close the matching hole in the client INSERT policy.
--
-- The policy verified ownership and a completed appointment, but said nothing
-- about `source`. A client posting their own review could set source='google'
-- and have it display as though it were a public, verifiable Google review.
-- Pin it: anything a client inserts is, by definition, a site review.
-- ---------------------------------------------------------------------------
drop policy if exists "testimonials_insert_own_completed" on public.testimonials;
create policy "testimonials_insert_own_completed" on public.testimonials
  for insert with check (
    (select auth.uid()) = user_id
    and approved = false
    and featured = false
    and source = 'site'
    and exists (
      select 1 from public.appointments a
      where a.id = testimonials.appointment_id
        and a.user_id = (select auth.uid())
        and a.status = 'completed'
    )
  );

-- ---------------------------------------------------------------------------
-- Verify.
-- ---------------------------------------------------------------------------
select source, count(*), count(rating) as with_rating
  from public.testimonials
 group by source;
