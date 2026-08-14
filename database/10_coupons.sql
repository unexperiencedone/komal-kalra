-- ============================================================================
-- 10_coupons.sql — discount codes
--
-- Added beyond the brief's core table list (research §9, change 6). A solo
-- practitioner running a festival offer or a referral discount otherwise does
-- it by manually refunding part of the payment, which is error-prone and
-- pollutes the refund data.
-- ============================================================================

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  description   text,

  discount_type discount_type not null,
  -- percentage: 1–100. fixed: paise.
  discount_value integer not null check (discount_value > 0),
  max_discount_paise bigint check (max_discount_paise > 0),  -- caps a percentage
  min_order_paise    bigint not null default 0 check (min_order_paise >= 0),

  -- NULL = applies to every service.
  service_ids   uuid[],

  usage_limit       integer check (usage_limit > 0),   -- NULL = unlimited
  usage_limit_per_user integer check (usage_limit_per_user > 0),
  times_used        integer not null default 0 check (times_used >= 0),

  starts_at     timestamptz not null default now(),
  expires_at    timestamptz,
  active        boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint coupons_code_format check (code ~ '^[A-Z0-9_-]{3,32}$'),
  constraint coupons_percentage_range
    check (discount_type <> 'percentage' or discount_value between 1 and 100),
  constraint coupons_date_order
    check (expires_at is null or expires_at > starts_at)
);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.appointments
  drop constraint if exists appointments_coupon_fk;
alter table public.appointments
  add constraint appointments_coupon_fk
  foreign key (coupon_id) references public.coupons(id) on delete set null;

-- Per-user redemption ledger, so usage_limit_per_user is enforceable.
create table if not exists public.coupon_redemptions (
  id            uuid primary key default gen_random_uuid(),
  coupon_id     uuid not null references public.coupons(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  discount_paise bigint not null check (discount_paise >= 0),
  created_at    timestamptz not null default now(),
  unique (coupon_id, appointment_id)
);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Coupons are NOT publicly readable — a public SELECT would let anyone
-- enumerate every discount code in the system. Validation happens server-side
-- via validate_coupon() with the service-role key.
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "coupon_redemptions_select_own" on public.coupon_redemptions;
create policy "coupon_redemptions_select_own" on public.coupon_redemptions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "coupon_redemptions_admin_all" on public.coupon_redemptions;
create policy "coupon_redemptions_admin_all" on public.coupon_redemptions
  for all using (public.is_admin()) with check (public.is_admin());
