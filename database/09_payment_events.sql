-- ============================================================================
-- 09_payment_events.sql — the webhook / provider event ledger
--
-- WHY (research §4.3)
-- Razorpay retries any webhook that does not return 2xx, so a handler WILL be
-- invoked more than once for the same event. Idempotency here is not a nicety;
-- without it a retry re-fires confirmation emails, re-runs side effects, and in
-- a badly built system re-credits money.
--
-- The UNIQUE (provider, event_id) constraint is the idempotency primitive: the
-- handler attempts the insert FIRST, and a unique violation means "already
-- handled, return 200 and stop".
--
-- DEVIATION FROM BRIEF (research §9, change 4)
-- The brief specified `payload_reference` pointing at external storage. We
-- store the payload inline as jsonb instead. Razorpay payloads are 2–4 KB, and
-- putting them in external storage adds a second system that can fail
-- independently of the dedupe key — in the one place in the codebase that most
-- needs to be atomic. Retention is handled by prune_payment_events() instead.
-- ============================================================================

create table if not exists public.payment_events (
  id          uuid primary key default gen_random_uuid(),
  provider    payment_provider not null default 'razorpay',

  -- Provider's own event id (Razorpay sends x-razorpay-event-id). If a provider
  -- ever omits it we fall back to a hash of the raw body, computed in the
  -- application, so this column is never null.
  event_id    text not null,
  event_type  text not null,          -- payment.captured, refund.processed, ...

  payment_id      uuid references public.payments(id) on delete set null,
  appointment_id  uuid references public.appointments(id) on delete set null,
  provider_payment_id text,
  provider_order_id   text,

  payload     jsonb not null,
  -- Signature that was verified before this row was written. Its presence is
  -- the audit proof that we never acted on unverified bytes.
  signature   text,

  processed      boolean not null default false,
  processed_at   timestamptz,
  processing_error text,
  attempts       integer not null default 0,

  received_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),

  constraint payment_events_event_id_unique unique (provider, event_id)
);

comment on constraint payment_events_event_id_unique on public.payment_events is
  'THE idempotency guarantee for webhooks. Duplicate delivery hits this constraint and short-circuits.';

-- Retention: payloads older than a year are cleared but the event row (and so
-- the dedupe key) is kept forever, because a very late retry must still be
-- recognised as a duplicate.
create or replace function public.prune_payment_event_payloads(older_than interval default interval '12 months')
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with pruned as (
    update public.payment_events
       set payload = '{"pruned": true}'::jsonb
     where received_at < now() - older_than
       and payload <> '{"pruned": true}'::jsonb
    returning 1
  )
  select count(*)::integer from pruned;
$$;

alter table public.payment_events enable row level security;

-- Admin read only. Written exclusively by the service-role webhook handler.
drop policy if exists "payment_events_select_admin" on public.payment_events;
create policy "payment_events_select_admin" on public.payment_events
  for select using (public.is_admin());
