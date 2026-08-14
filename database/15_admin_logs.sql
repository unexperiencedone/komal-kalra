-- ============================================================================
-- 15_admin_logs.sql — audit trail for privileged actions
--
-- Anything that moves money, changes a role, or alters someone else's booking
-- writes here. Append-only by construction: there is no UPDATE or DELETE policy
-- for anyone, including admins.
-- ============================================================================

create table if not exists public.admin_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,        -- payment.refund, appointment.cancel, ...
  entity_type text not null,        -- payment | appointment | service | ...
  entity_id   uuid,
  -- before/after snapshots and a human reason. Never contains card data.
  metadata    jsonb not null default '{}'::jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

drop policy if exists "admin_logs_select_admin" on public.admin_logs;
create policy "admin_logs_select_admin" on public.admin_logs
  for select using (public.is_admin());

-- No insert/update/delete policies. Rows are written only with the
-- service-role key, which bypasses RLS. This makes the log tamper-resistant
-- from the application's own admin session.
