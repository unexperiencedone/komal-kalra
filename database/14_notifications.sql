-- ============================================================================
-- 14_notifications.sql — in-app notifications + the outbound delivery queue
--
-- Split into two tables on purpose:
--   notifications         what the user sees in their dashboard bell
--   notification_outbox   what we must deliver over email/WhatsApp/SMS
--
-- The outbox exists so delivery is retryable and auditable. Sending email
-- inline from a webhook handler means a transient SMTP failure either loses the
-- notification or (worse) causes the webhook to return 500 and Razorpay to
-- redeliver the payment event. Research §4.3, point 3.
-- ============================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  -- Deep link into the dashboard, e.g. /dashboard/appointments/<id>
  action_url  text,
  category    text not null default 'general',
  read        boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using ((select auth.uid()) = user_id);

-- The only field a user may change is `read`; enforced by the trigger below.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.title is distinct from old.title
  or new.message is distinct from old.message
  or new.action_url is distinct from old.action_url
  or new.user_id is distinct from old.user_id then
    raise exception 'Only the read flag may be modified' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_protect_columns on public.notifications;
create trigger notifications_protect_columns
  before update on public.notifications
  for each row execute function public.protect_notification_columns();

-- ---------------------------------------------------------------------------
-- Outbound delivery queue
-- ---------------------------------------------------------------------------
create table if not exists public.notification_outbox (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  channel     text not null check (channel in ('email','whatsapp','sms')),
  recipient   text not null,        -- address or E.164 number
  template    text not null,        -- booking_confirmed, payment_failed, ...
  payload     jsonb not null default '{}'::jsonb,

  -- Dedupe key, e.g. 'booking_confirmed:<appointment_id>'. Guarantees the
  -- confirmation email is queued once even if verify and webhook both fire.
  dedupe_key  text unique,

  status      text not null default 'queued'
                check (status in ('queued','sending','sent','failed','skipped')),
  attempts    integer not null default 0,
  last_error  text,
  scheduled_for timestamptz not null default now(),  -- future = reminder
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists notification_outbox_set_updated_at on public.notification_outbox;
create trigger notification_outbox_set_updated_at
  before update on public.notification_outbox
  for each row execute function public.set_updated_at();

alter table public.notification_outbox enable row level security;

drop policy if exists "notification_outbox_admin_select" on public.notification_outbox;
create policy "notification_outbox_admin_select" on public.notification_outbox
  for select using (public.is_admin());
