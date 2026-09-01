-- ============================================================================
-- 29_booking_contact.sql — the contact details given for THIS booking
--
-- Booking no longer requires an account (see src/lib/auth/booking-identity.ts),
-- so the contact details typed into the booking form are now the primary way we
-- reach the client — including the WhatsApp confirmation. They must be stored
-- against the appointment, not read back off the profile.
--
-- WHY NOT JUST READ profiles.phone
--
-- Same reason `price_paise` is snapshotted here rather than joined from
-- services: the profile is mutable and shared across bookings, and this row
-- must record what was true at the time.
--
-- Concretely: a returning client books for herself in March on +91 98xxx, then
-- books in July from a new number. Overwriting the profile makes March's record
-- retroactively wrong; not overwriting it sends July's confirmation to a phone
-- she no longer uses. Neither is acceptable, and both disappear once the
-- booking carries its own contact details.
--
-- It also covers the ordinary case of one person booking on behalf of a
-- parent — the profile is the account holder, this is who to message about
-- this session.
--
-- These are set by the application immediately after create_pending_appointment
-- returns, rather than by widening that function's signature. The function is
-- SECURITY DEFINER with an explicit REVOKE listing its exact argument types; a
-- new signature would leave the old one callable alongside it unless every
-- grant were rewritten too. Not worth it for two columns of contact data that
-- carry no pricing or scheduling authority.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.appointments
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_contact_phone_valid'
  ) then
    alter table public.appointments
      add constraint appointments_contact_phone_valid
      check (contact_phone is null or contact_phone ~ '^\+?[0-9 \-]{7,20}$');
  end if;
end $$;

comment on column public.appointments.contact_email is
  'Email given on the booking form for THIS booking. Snapshotted rather than '
  'joined from profiles, which is mutable and shared across bookings.';

comment on column public.appointments.contact_phone is
  'Phone given on the booking form for THIS booking. This is the number the '
  'WhatsApp confirmation goes to. Never overwritten by a later booking.';

-- ---------------------------------------------------------------------------
-- Backfill from the profile for bookings made before this column existed.
--
-- Only where the column is still empty, so re-running cannot overwrite a real
-- captured contact with a since-changed profile value.
-- ---------------------------------------------------------------------------
update public.appointments a
   set contact_email = coalesce(a.contact_email, p.email),
       contact_phone = coalesce(a.contact_phone, p.phone)
  from public.profiles p
 where p.id = a.user_id
   and (a.contact_email is null or a.contact_phone is null);

-- ---------------------------------------------------------------------------
-- Verify: expect no confirmed appointment left without an email to reach.
-- ---------------------------------------------------------------------------
select count(*) filter (where contact_email is null) as missing_email,
       count(*) filter (where contact_phone is null) as missing_phone,
       count(*) as total
  from public.appointments
 where status in ('confirmed', 'completed');
