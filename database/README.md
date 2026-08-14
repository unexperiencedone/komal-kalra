# Database

One file per logical concern, numbered in dependency order. Run them **in order**
in the Supabase SQL editor (or `psql`). Every file is idempotent — re-running the
whole set is safe.

```
00_extensions.sql        pgcrypto, btree_gist (required), pg_trgm
01_enums.sql             domain enums + the payment state machine comment
02_shared.sql            set_updated_at(), is_admin(), is_service_role()
03_profiles.sql          users, role guard, signup trigger
04_services.sql          consultation catalogue (public read)
05_availability.sql      recurring rules + one-off exceptions
06_slot_holds.sql        temporary reservations (double-booking defence, L1)
07_appointments.sql      bookings + the EXCLUDE overlap constraint (L3)
08_payments.sql          payments + refunds ledger
09_payment_events.sql    webhook idempotency ledger
10_coupons.sql           discount codes + redemptions
11_appointment_notes.sql practitioner's private notes (admin-only)
12_testimonials.sql      social proof with approval gate
13_leads.sql             contact requests + abandoned bookings
14_notifications.sql     in-app bell + outbound delivery outbox
15_admin_logs.sql        append-only audit trail
16_functions_booking.sql slot derivation, holds, appointment creation (L2)
17_functions_payments.sql payment state machine, refunds, revenue reporting
18_indexes.sql           RLS-supporting + query-shape indexes
19_seed.sql              PLACEHOLDER services and availability
```

## Quick run

```bash
for f in database/*.sql; do
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

## After running

1. Sign up through `/login` with the email Komal will use.
2. Promote that account **once**, from the Supabase SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'her@email.com';
   ```
   There is no application code path that can do this. See `03_profiles.sql`.
3. Replace the placeholder prices and working hours from `/admin/services`
   and `/admin/availability`.

## Design notes worth knowing before you edit anything

- **All money is `bigint` paise.** Never introduce a rupee float. `src/lib/money.ts`
  is the only place that converts for display.
- **`appointments_no_overlap`** is an `EXCLUDE USING gist` constraint. It is the
  reason double-booking is impossible rather than merely unlikely. Do not drop it.
- **Every table has RLS enabled.** A table with RLS on and no policies denies
  everything to `anon`/`authenticated` — that is intentional for `slot_holds`,
  `payment_events` and `admin_logs`, which are written only with the service key.
- **`payment_events` has `UNIQUE (provider, event_id)`.** That constraint *is*
  the webhook idempotency mechanism. Do not relax it.
- Privileged functions are `REVOKE`d from `anon`/`authenticated` at the bottom of
  `16_` and `17_`. If you add a function that touches money or bookings, revoke it.
