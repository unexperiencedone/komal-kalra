-- ============================================================================
-- 02_shared.sql — shared helpers used by every table
-- Defined before the tables so triggers and policies can reference them.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER + STABLE. Research finding (docs/research.md §6.1): a helper
-- function instead of a correlated EXISTS subquery inside every policy avoids a
-- per-row subquery and lets Postgres cache the result for the statement. It also
-- avoids infinite recursion when a policy on `profiles` needs to know whether
-- the caller is an admin.
--
-- search_path is pinned to close the search-path hijack vector that
-- SECURITY DEFINER functions are otherwise exposed to.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'True when the calling user has the admin role. Safe to expose: leaks only the caller''s own role.';

-- Are we running with the service-role key (trusted server) rather than as an
-- end user? Gates privileged writes such as role changes.
create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
$$;
