-- ============================================================================
-- 11_appointment_notes.sql — the practitioner's private consultation record
--
-- Separate table rather than a column on appointments because notes accumulate
-- over a session, are the most sensitive data in the system, and must never be
-- readable by the client even accidentally through a SELECT * on appointments.
-- ============================================================================

create table if not exists public.appointment_notes (
  id            uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete restrict,
  body          text not null,
  -- Follow-up the practitioner intends; drives the admin "Pending actions" list.
  follow_up_at  timestamptz,
  follow_up_done boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists appointment_notes_set_updated_at on public.appointment_notes;
create trigger appointment_notes_set_updated_at
  before update on public.appointment_notes
  for each row execute function public.set_updated_at();

alter table public.appointment_notes enable row level security;

-- ADMIN ONLY. There is intentionally no owner-read policy: these are the
-- practitioner's private clinical-style notes, not a client-facing summary.
drop policy if exists "appointment_notes_admin_all" on public.appointment_notes;
create policy "appointment_notes_admin_all" on public.appointment_notes
  for all using (public.is_admin()) with check (public.is_admin());
