-- ============================================================================
-- 08_payments.sql — money
--
-- One row per payment attempt against one appointment. An appointment may have
-- several payment rows over its life (a failed attempt, then a successful
-- retry); at most one of them may be in a settled-successful state.
-- ============================================================================

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  user_id        uuid not null references public.profiles(id) on delete restrict,

  provider           payment_provider not null default 'razorpay',
  provider_order_id  text,   -- Razorpay order_...
  provider_payment_id text,  -- Razorpay pay_...
  provider_signature text,   -- the verified handler signature, kept for audit

  -- PAISE. Integer. Always. See research §4.5.
  amount_paise          bigint not null check (amount_paise >= 0),
  amount_refunded_paise bigint not null default 0 check (amount_refunded_paise >= 0),
  currency              char(3) not null default 'INR',

  status payment_status not null default 'created',

  -- Set the moment a server-side HMAC check passes. A payment that is `paid`
  -- with verified_at NULL would indicate a bug, and the reconciliation job
  -- reports it.
  verified_at   timestamptz,
  paid_at       timestamptz,
  failed_at     timestamptz,
  refunded_at   timestamptz,

  method        text,   -- upi / card / netbanking / wallet, as reported by provider
  error_code        text,
  error_description text,

  -- Sent to the provider on order creation so a retried request cannot create a
  -- second order for the same booking attempt.
  idempotency_key text unique,

  -- Provider receipt string; also our internal invoice number once paid.
  receipt_number text unique,

  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint payments_refund_within_amount
    check (amount_refunded_paise <= amount_paise),
  -- A fully refunded payment must actually be fully refunded.
  constraint payments_refund_status_consistent check (
    (status <> 'refunded'          or amount_refunded_paise = amount_paise) and
    (status <> 'partially_refunded' or (amount_refunded_paise > 0 and amount_refunded_paise < amount_paise))
  )
);

-- Provider ids must be globally unique when present. This is a hard defence
-- against processing the same Razorpay payment twice under two payment rows.
create unique index if not exists payments_provider_payment_id_uidx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists payments_provider_order_id_uidx
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

-- At most ONE successful payment per appointment. If a duplicate charge somehow
-- occurs, the second insert fails loudly instead of quietly double-charging.
create unique index if not exists payments_one_success_per_appointment_uidx
  on public.payments (appointment_id)
  where status in ('paid','partially_refunded','refunded');

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep profiles.total_spent_paise accurate (net of refunds).
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_spend()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles p
     set total_spent_paise = coalesce((
           select sum(pm.amount_paise - pm.amount_refunded_paise)
           from public.payments pm
           where pm.user_id = target
             and pm.status in ('paid','partially_refunded')
         ), 0)
   where p.id = target;
  return null;
end;
$$;

drop trigger if exists payments_sync_profile_spend on public.payments;
create trigger payments_sync_profile_spend
  after insert or update of status, amount_refunded_paise or delete on public.payments
  for each row execute function public.sync_profile_spend();

-- ---------------------------------------------------------------------------
-- RLS
--
-- Read-only for the owner. There is NO client write policy of any kind: every
-- mutation to this table happens server-side with the service-role key after a
-- signature check. A client that could write here could mark itself paid.
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using ((select auth.uid()) = user_id);

drop policy if exists "payments_select_admin" on public.payments;
create policy "payments_select_admin" on public.payments
  for select using (public.is_admin());

-- Admin writes are permitted (refunds, manual reconciliation) but the
-- application still routes them through the service-role helpers so that an
-- admin_logs entry is always produced.
drop policy if exists "payments_write_admin" on public.payments;
create policy "payments_write_admin" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- refunds — one row per refund operation, so partial refunds are auditable
-- ============================================================================
create table if not exists public.refunds (
  id            uuid primary key default gen_random_uuid(),
  payment_id    uuid not null references public.payments(id) on delete restrict,
  provider_refund_id text,
  amount_paise  bigint not null check (amount_paise > 0),
  currency      char(3) not null default 'INR',
  status        text not null default 'pending'
                  check (status in ('pending','processed','failed')),
  reason        text,
  initiated_by  uuid references public.profiles(id) on delete set null,
  idempotency_key text unique,
  provider_response jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists refunds_provider_refund_id_uidx
  on public.refunds (provider_refund_id)
  where provider_refund_id is not null;

drop trigger if exists refunds_set_updated_at on public.refunds;
create trigger refunds_set_updated_at
  before update on public.refunds
  for each row execute function public.set_updated_at();

alter table public.refunds enable row level security;

drop policy if exists "refunds_select_own" on public.refunds;
create policy "refunds_select_own" on public.refunds
  for select using (
    exists (
      select 1 from public.payments p
      where p.id = refunds.payment_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "refunds_admin_all" on public.refunds;
create policy "refunds_admin_all" on public.refunds
  for all using (public.is_admin()) with check (public.is_admin());
