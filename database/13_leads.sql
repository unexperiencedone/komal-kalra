-- ============================================================================
-- 13_leads.sql — contact requests and abandoned bookings
-- ============================================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  message     text,

  source      lead_source not null default 'contact_form',
  status      lead_status not null default 'new',

  -- Context, when the lead came from an abandoned booking (research §3.4).
  service_id  uuid references public.services(id) on delete set null,
  intended_slot_at timestamptz,
  slot_hold_id uuid references public.slot_holds(id) on delete set null,

  -- Set when the visitor was signed in.
  user_id     uuid references public.profiles(id) on delete set null,

  assigned_note text,
  follow_up_at  timestamptz,
  contacted_at  timestamptz,
  converted_appointment_id uuid references public.appointments(id) on delete set null,

  -- Light attribution, no third-party tracking.
  utm_source  text,
  utm_medium  text,
  utm_campaign text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint leads_has_a_contact_channel check (email is not null or phone is not null)
);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- Anonymous visitors submit the contact form. INSERT is allowed for anon, but
-- SELECT is not — otherwise the form would double as a public dump of every
-- enquiry the business has ever received. Rate limiting sits in the API layer
-- (src/lib/rate-limit.ts); this policy only controls authorisation.
drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public" on public.leads
  for insert with check (
    status = 'new'
    and converted_appointment_id is null
  );

drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all" on public.leads
  for all using (public.is_admin()) with check (public.is_admin());
