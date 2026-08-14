-- ============================================================================
-- 12_testimonials.sql — social proof, with an approval gate
--
-- Nothing is published without explicit admin approval, and the landing page
-- renders NOTHING when there are no approved rows. The brief's instruction not
-- to invent statistics is enforced structurally: there is no seeded testimonial
-- data and no hardcoded review text anywhere in the codebase.
-- ============================================================================

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  -- Nullable so the admin can enter a testimonial received over WhatsApp or
  -- Instagram on behalf of a client who has no account.
  user_id     uuid references public.profiles(id) on delete set null,
  service_id  uuid references public.services(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,

  author_name text not null,
  author_location text,
  -- Clients frequently want astrological consultations kept private.
  display_initials_only boolean not null default false,

  rating      smallint not null check (rating between 1 and 5),
  review      text not null check (length(trim(review)) >= 20),

  approved    boolean not null default false,
  featured    boolean not null default false,
  sort_order  integer not null default 0,

  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_select_approved" on public.testimonials;
create policy "testimonials_select_approved" on public.testimonials
  for select using (approved = true);

drop policy if exists "testimonials_select_own" on public.testimonials;
create policy "testimonials_select_own" on public.testimonials
  for select using ((select auth.uid()) = user_id);

-- A client may submit a review only for an appointment they actually completed.
-- The WITH CHECK does the verification, so a fabricated review cannot be posted.
drop policy if exists "testimonials_insert_own_completed" on public.testimonials;
create policy "testimonials_insert_own_completed" on public.testimonials
  for insert with check (
    (select auth.uid()) = user_id
    and approved = false
    and featured = false
    and exists (
      select 1 from public.appointments a
      where a.id = testimonials.appointment_id
        and a.user_id = (select auth.uid())
        and a.status = 'completed'
    )
  );

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());
