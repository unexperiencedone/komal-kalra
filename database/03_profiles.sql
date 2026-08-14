-- ============================================================================
-- 03_profiles.sql — user profiles, mirrored 1:1 from auth.users
-- ============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text        not null,
  full_name     text,
  phone         text,
  role          user_role   not null default 'client',

  -- Birth information for astrological work. Nullable: collected at booking
  -- time rather than signup, because asking for it before the visitor has
  -- committed is a documented conversion killer (docs/research.md §3).
  -- Sensitive personal data: never exposed via any public view, readable only
  -- by the owner and by admin.
  birth_date       date,
  birth_time       time,
  birth_place      text,
  birth_time_known boolean not null default true,

  preferred_language text not null default 'en',
  marketing_opt_in   boolean not null default false,

  -- Denormalised counters, maintained by trigger (08_payments.sql,
  -- 07_appointments.sql) so the admin client list does not need a correlated
  -- aggregate per row.
  total_spent_paise   bigint  not null default 0 check (total_spent_paise >= 0),
  appointments_count  integer not null default 0 check (appointments_count >= 0),
  last_appointment_at timestamptz,

  notes         text,          -- admin-only internal notes about the client
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint profiles_email_valid check (position('@' in email) > 1),
  constraint profiles_phone_valid check (phone is null or phone ~ '^\+?[0-9 \-]{7,20}$')
);

comment on column public.profiles.role is
  'Privilege level. Changeable ONLY via the service-role key or the SQL editor — enforced by protect_profile_role().';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile on signup. SECURITY DEFINER because auth.users triggers
-- execute as the auth system, which has no rights on public.profiles.
--
-- It always writes role = 'client'. There is no code path in the application
-- that can create an admin — this is where that requirement is enforced.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role escalation guard.
--
-- RLS cannot express "you may update this row but not this column". This
-- trigger closes that gap: changing `role` from a non service-role connection
-- raises. Combined with the RLS policies below, the only ways to create an
-- admin are the Supabase SQL editor or a server process holding
-- SUPABASE_SERVICE_ROLE_KEY.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_service_role() then
    raise exception 'Role changes are not permitted through the API'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- No INSERT policy: profiles are created only by handle_new_user().
-- No DELETE policy: deletion cascades from auth.users.
