-- ============================================================================
-- 01_enums.sql — domain enums
--
-- Enums rather than free text because these values are read by application
-- code, and a typo in a status string is a silent data bug that a text column
-- would happily accept.
-- ============================================================================

do $$ begin
  create type user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

-- Appointment lifecycle.
--   pending_payment  slot held, order created, money not yet confirmed
--   confirmed        verified payment received; a real booking
--   completed        consultation has happened
--   cancelled        cancelled by client or admin
--   no_show          client did not attend
--   rescheduled      superseded by a newer row (see rescheduled_to_id)
--   needs_attention  payment succeeded but the slot could not be secured.
--                    Money is held and an admin must refund or re-slot.
do $$ begin
  create type appointment_status as enum (
    'pending_payment','confirmed','completed','cancelled',
    'no_show','rescheduled','needs_attention'
  );
exception when duplicate_object then null; end $$;

-- Payment state machine. Legal transitions are enforced by
-- public.assert_payment_transition() in 17_functions_payments.sql.
--
--   created ─▶ pending ─▶ processing ─▶ paid ─▶ refunded
--                 │           │          └───▶ partially_refunded ─▶ refunded
--                 │           └────────▶ failed
--                 └──────────────────────────▶ cancelled
do $$ begin
  create type payment_status as enum (
    'created','pending','processing','paid','failed',
    'cancelled','refunded','partially_refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('razorpay','stripe','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('new','contacted','qualified','converted','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_source as enum ('contact_form','abandoned_booking','phone','instagram','referral','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percentage','fixed');
exception when duplicate_object then null; end $$;
