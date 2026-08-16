-- ============================================================================
-- tools/delete-service.sql — permanently remove a service and its test data
--
-- NOT PART OF THE MIGRATION SEQUENCE. This folder is deliberately outside the
-- numbered 00–21 files so that running the schema in order never executes it.
-- It is destructive and must be run by hand, deliberately, one section at a
-- time.
--
-- ---------------------------------------------------------------------------
-- WHY CANCELLING THE APPOINTMENT IS NOT ENOUGH
-- ---------------------------------------------------------------------------
-- appointments.service_id references services(id) ON DELETE RESTRICT.
--
-- RESTRICT counts ROWS, not statuses. Cancelling sets status = 'cancelled';
-- the row still exists and still points at the service, so the delete fails
-- with exactly the same foreign-key error as before. The row has to go, not
-- just change state.
--
-- The chain is two deep, and both links are RESTRICT:
--
--     services  ←(restrict)—  appointments  ←(restrict)—  payments
--
-- So the delete order is the reverse: payments, then appointments, then the
-- service. Everything else attached to an appointment gets out of the way on
-- its own — notes and coupon redemptions CASCADE, payment_events and
-- testimonials SET NULL (the webhook audit trail deliberately survives).
--
-- ---------------------------------------------------------------------------
-- ⚠️  BEFORE YOU DELETE PAYMENT ROWS — CHECK WHETHER THE MONEY WAS REAL
-- ---------------------------------------------------------------------------
-- Section 1 prints the provider order IDs.
--
--   order_test_…  /  pay_test_…   → Razorpay TEST mode. No real money moved.
--                                   Safe to delete outright.
--
--   order_…       /  pay_…        → LIVE mode. Real money moved, even if it was
--                                   ₹1. Razorpay keeps that transaction
--                                   forever; deleting the row here does not
--                                   undo it, it just means your database no
--                                   longer agrees with your payment provider.
--                                   Reconciliation, refund history and the
--                                   profiles.total_spent_paise trigger all
--                                   depend on that row.
--
-- For a LIVE payment: refund it in /admin/payments, then deactivate the
-- service (Active checkbox in the admin editor) instead of deleting it. A
-- retired service still referenced by old bookings is a normal, healthy state.
-- Deleting is only worth it for a service that was never used with real money.
-- ============================================================================

\set slug 'test_service'


-- ---------------------------------------------------------------------------
-- 1. INSPECT. Run this on its own first and read the output.
-- ---------------------------------------------------------------------------
select s.id, s.slug, s.title, s.active, s.internal
  from public.services s
 where s.slug = :'slug';

select a.reference,
       a.status,
       a.payment_status,
       a.starts_at,
       p.status                as payment_row_status,
       p.amount_paise,
       p.amount_refunded_paise,
       p.provider_order_id,    -- 'order_test_…' = test mode, 'order_…' = LIVE
       p.provider_payment_id
  from public.appointments a
  left join public.payments p on p.appointment_id = a.id
  join public.services s on s.id = a.service_id
 where s.slug = :'slug'
 order by a.starts_at;

-- Nothing returned by the second query? Then no appointment exists and you can
-- skip straight to section 3.


-- ---------------------------------------------------------------------------
-- 2. DELETE THE BOOKING DATA.
--
--    Only run this once section 1 has convinced you the payments were test
--    mode, or that no real money is involved. Wrapped in a transaction so a
--    surprise foreign key rolls the whole thing back rather than leaving you
--    half-deleted.
-- ---------------------------------------------------------------------------
begin;

  -- Slot holds first — they cascade anyway, but clearing them up front avoids
  -- a hold expiring mid-transaction and confusing the picture.
  delete from public.slot_holds
   where service_id = (select id from public.services where slug = :'slug');

  -- payments → appointments, innermost first.
  delete from public.payments
   where appointment_id in (
     select a.id from public.appointments a
       join public.services s on s.id = a.service_id
      where s.slug = :'slug'
   );

  delete from public.appointments
   where service_id = (select id from public.services where slug = :'slug');

commit;


-- ---------------------------------------------------------------------------
-- 3. DELETE THE SERVICE.
--
--    This now succeeds. If it still raises a foreign-key violation, something
--    else references the row — read the error, it names the table. Do not
--    reach for `cascade`: the restriction is doing its job and telling you a
--    record you care about is attached.
-- ---------------------------------------------------------------------------
delete from public.services where slug = :'slug';


-- ---------------------------------------------------------------------------
-- 4. CONFIRM. Both should return zero rows.
-- ---------------------------------------------------------------------------
select * from public.services where slug = :'slug';

select a.reference from public.appointments a
  left join public.services s on s.id = a.service_id
 where s.id is null;   -- orphaned appointments; there should never be any


-- ---------------------------------------------------------------------------
-- THE ALTERNATIVE, WHICH IS USUALLY BETTER
--
-- Hide it and keep every record intact. Untick "Active" in the admin service
-- editor, or:
--
--   update public.services set active = false where slug = 'test_service';
--
-- The service vanishes from the homepage, /services, the sitemap and the
-- booking flow, and stays visible in the admin list with a "Hidden" badge.
-- Nothing is destroyed, and it is reversible.
-- ---------------------------------------------------------------------------
