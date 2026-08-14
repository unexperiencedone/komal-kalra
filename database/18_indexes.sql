-- ============================================================================
-- 18_indexes.sql
--
-- Two categories:
--   1. RLS-supporting indexes. Research §6.1: the biggest RLS performance
--      killer is a missing index on a column referenced by a policy. Every
--      user_id used in a policy is indexed here.
--   2. Query-shape indexes for the specific screens that exist in this app.
--      Nothing speculative — each one maps to a real query.
-- ============================================================================

-- --- RLS support --------------------------------------------------------
create index if not exists profiles_role_idx            on public.profiles (role) where role = 'admin';
create index if not exists appointments_user_id_idx     on public.appointments (user_id);
create index if not exists payments_user_id_idx         on public.payments (user_id);
create index if not exists notifications_user_id_idx    on public.notifications (user_id);
create index if not exists testimonials_user_id_idx     on public.testimonials (user_id);
create index if not exists coupon_redemptions_user_idx  on public.coupon_redemptions (user_id);

-- --- Booking calendar ---------------------------------------------------
-- get_available_slots scans active appointments in a date window.
create index if not exists appointments_active_window_idx
  on public.appointments (starts_at)
  where status in ('pending_payment','confirmed','rescheduled');

-- Live-hold lookup, the hottest query in the booking flow.
create index if not exists slot_holds_live_idx
  on public.slot_holds (starts_at)
  where released_at is null;

create index if not exists slot_holds_session_idx on public.slot_holds (session_key);
create index if not exists slot_holds_expiry_idx  on public.slot_holds (expires_at) where released_at is null;

create index if not exists availability_rules_weekday_idx
  on public.availability_rules (weekday) where active = true;
create index if not exists availability_exceptions_date_idx
  on public.availability_exceptions (date);

-- --- Admin screens ------------------------------------------------------
-- "Today" and "Upcoming" lists.
create index if not exists appointments_starts_status_idx on public.appointments (starts_at desc, status);
create index if not exists appointments_status_idx        on public.appointments (status);
create index if not exists appointments_created_idx       on public.appointments (created_at desc);
create index if not exists appointments_service_idx       on public.appointments (service_id);
create index if not exists appointments_reference_idx     on public.appointments (reference);

-- Payments table, filtered by status and sorted by date.
create index if not exists payments_status_created_idx on public.payments (status, created_at desc);
create index if not exists payments_paid_at_idx        on public.payments (paid_at desc) where paid_at is not null;
create index if not exists payments_appointment_idx    on public.payments (appointment_id);

-- Reconciliation sweep: payments stuck mid-flight.
create index if not exists payments_stuck_idx
  on public.payments (created_at)
  where status in ('created','pending','processing');

create index if not exists payment_events_unprocessed_idx
  on public.payment_events (received_at) where processed = false;
create index if not exists payment_events_payment_idx on public.payment_events (payment_id);
create index if not exists payment_events_type_idx    on public.payment_events (event_type, received_at desc);

create index if not exists refunds_payment_idx on public.refunds (payment_id);

-- Leads pipeline.
create index if not exists leads_status_created_idx on public.leads (status, created_at desc);
create index if not exists leads_followup_idx on public.leads (follow_up_at) where follow_up_at is not null;

-- Notifications bell: unread count.
create index if not exists notifications_unread_idx
  on public.notifications (user_id, created_at desc) where read = false;

-- Outbox worker.
create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (scheduled_for)
  where status in ('queued','failed');

-- Public marketing pages.
create index if not exists services_active_sort_idx on public.services (active, sort_order, created_at);
create index if not exists testimonials_public_idx
  on public.testimonials (featured desc, sort_order, created_at desc) where approved = true;

create index if not exists appointment_notes_appointment_idx on public.appointment_notes (appointment_id);
create index if not exists appointment_notes_followup_idx
  on public.appointment_notes (follow_up_at) where follow_up_done = false;

create index if not exists admin_logs_created_idx on public.admin_logs (created_at desc);
create index if not exists admin_logs_entity_idx  on public.admin_logs (entity_type, entity_id);

-- --- Client search (admin) ---------------------------------------------
-- Trigram indexes so "kom" matches "Komal" without a leading-wildcard seq scan.
create index if not exists profiles_name_trgm_idx  on public.profiles using gin (full_name gin_trgm_ops);
create index if not exists profiles_email_trgm_idx on public.profiles using gin (email gin_trgm_ops);
create index if not exists profiles_phone_trgm_idx on public.profiles using gin (phone gin_trgm_ops);
create index if not exists leads_name_trgm_idx     on public.leads using gin (name gin_trgm_ops);
