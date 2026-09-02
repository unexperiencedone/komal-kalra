-- ============================================================================
-- 30_whatsapp_delivery.sql — delivery receipts and inbound replies
--
-- Sending a WhatsApp message is TWO events, and the gap between them is where
-- this feature quietly fails.
--
-- Meta's API returns 200 the moment it ACCEPTS a message. That is not delivery.
-- A message can be accepted and then fail because the number has no WhatsApp
-- account, because the user blocked the business, or because a template
-- variable held a newline. Without the webhook we mark the row `sent`, the
-- client receives nothing, and nobody finds out until they turn up at the wrong
-- time — or do not turn up at all.
--
-- So the outbox gains a provider message id to match receipts against, and two
-- terminal states beyond `sent`.
--
-- WHY `undelivered` IS SEPARATE FROM `failed`
--
-- The worker retries `failed` rows (up to five attempts). That is right for a
-- transient send error and wrong for a permanent delivery failure: re-sending
-- to a number that has no WhatsApp account will never work, and every attempt
-- is billed. `undelivered` is terminal — the worker's query does not select it,
-- so it stays visible in the table without costing anything further.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.notification_outbox
  add column if not exists provider_message_id text,
  add column if not exists delivered_at timestamptz;

comment on column public.notification_outbox.provider_message_id is
  'The provider''s own id for the sent message — a Meta "wamid" for WhatsApp. '
  'This is the ONLY thing that ties a delivery receipt back to a booking, so '
  'it must be captured at send time; the webhook has nothing else to match on.';

-- Delivery receipts arrive keyed on this and nothing else, so it needs an index.
create index if not exists notification_outbox_provider_message_id_idx
  on public.notification_outbox (provider_message_id)
  where provider_message_id is not null;

-- ---------------------------------------------------------------------------
-- Widen the status constraint.
--
-- Dropped and recreated rather than added alongside: two overlapping CHECKs on
-- one column both have to pass, so leaving the old one in place would keep
-- rejecting exactly the values being added.
-- ---------------------------------------------------------------------------
alter table public.notification_outbox
  drop constraint if exists notification_outbox_status_check;

alter table public.notification_outbox
  add constraint notification_outbox_status_check
  check (status in ('queued','sending','sent','failed','skipped','delivered','undelivered'));

comment on column public.notification_outbox.status is
  'queued/sending/sent are OUR view of the send. delivered/undelivered come '
  'from the provider''s webhook and are terminal — the worker never picks them '
  'up. `sent` means "the provider accepted it", which is not the same as "it '
  'arrived", and treating the two as equivalent is how a silent delivery '
  'failure goes unnoticed for weeks.';

-- ---------------------------------------------------------------------------
-- Inbound replies.
--
-- Clients WILL reply to a booking confirmation — "can we make it 4pm?", "I sent
-- the payment", "which link?". On the Meta Cloud API direct there is no inbox
-- of any kind, so without somewhere to put these they are received by the
-- webhook and discarded. A practice that appears to accept WhatsApp messages
-- and silently bins them is worse than one that never invited them.
--
-- This table is the floor, not a solution: it guarantees nothing is lost. See
-- docs/whatsapp-setup.md on why a BSP inbox is still the right answer for
-- actually answering people.
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_inbound (
  id            uuid primary key default gen_random_uuid(),
  -- Meta's message id. UNIQUE because webhooks are retried on any non-2xx, and
  -- at-least-once delivery means the same reply can arrive several times.
  -- Idempotency is a database constraint, not a code check — same rule the
  -- payments webhook follows.
  provider_message_id text unique not null,
  from_phone    text not null,
  profile_name  text,
  message_type  text not null default 'text',
  body          text,
  -- Whole payload kept for the types we do not parse (images, audio, location).
  -- Cheap, and it means an unhandled message type is still recoverable.
  raw           jsonb not null default '{}'::jsonb,
  -- Best-effort link to a client, by matching the sender against the number
  -- given at booking. Nullable: plenty of people message from a second phone.
  user_id       uuid references public.profiles(id) on delete set null,
  handled       boolean not null default false,
  received_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists whatsapp_inbound_unhandled_idx
  on public.whatsapp_inbound (received_at desc)
  where handled = false;

alter table public.whatsapp_inbound enable row level security;

-- Admin only. There is deliberately no client-facing policy: this holds other
-- people's messages, and no surface in the app needs to read it as a client.
drop policy if exists "whatsapp_inbound_admin_all" on public.whatsapp_inbound;
create policy "whatsapp_inbound_admin_all" on public.whatsapp_inbound
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify.
-- ---------------------------------------------------------------------------
select channel, status, count(*)
  from public.notification_outbox
 group by channel, status
 order by channel, status;
