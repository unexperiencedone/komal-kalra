# Verifying that live payments actually work

How to run the ₹1 check, what each stage of it proves, and what to do with the
rupee afterwards.

---

## Why a real payment is the only meaningful test

Razorpay test mode uses a **different key pair, a different webhook secret and a
sandbox that never touches a bank**. A green test-mode run tells you the code
compiles and the happy path is wired up. It does not tell you:

- that the live keys in your hosting environment are the right ones
- that `RAZORPAY_WEBHOOK_SECRET` matches the secret registered on the live
  webhook, rather than the test one
- that the webhook URL Razorpay has on file points at your production domain
- that your account is activated and can actually capture money
- that settlement reaches the bank account you think it does

Every one of those has failed silently for somebody, and each fails *only* in
production. So the check is one genuine transaction at the smallest amount
Razorpay will capture: **₹1**.

This is not a mock. `guidance-verification` is a real service row and booking it
runs the identical code path as a ₹2,100 booking — slot hold, advisory lock,
order creation, HMAC signature verification, webhook delivery, appointment
confirmation. A fake "test payment" button would exercise none of that and would
prove nothing, which is precisely why there isn't one.

---

## Setup (once)

Run the migration against your database:

```
database/20_verification_service.sql
```

It is idempotent — safe on a fresh database or an existing one, and safe to run
again. It adds the `internal` column if missing, recreates the public select
policy, and upserts the service.

Then confirm you are an admin:

```sql
select email, role from public.profiles where email = 'you@example.com';
-- expect: admin
```

---

## Why this is safe to leave in production

The obvious worry is a live ₹1 service being a standing offer to buy a real
consultation for a rupee. It isn't, and the reason matters:

| | |
|---|---|
| **Hidden by RLS, not by application code** | The public select policy is `active = true and internal = false`. An anonymous visitor or a signed-in client querying this row gets **no row back** — not a row that the app then filters out. A forgotten `.eq()` in some future query cannot expose it. |
| **`active` stays `true` on purpose** | `active = false` would hide it too, but `get_available_slots`, `create_slot_hold` and `create_pending_appointment` all require `active = true`. An inactive service is unbookable by *anyone*, admin included — useless as a payment test. Concealment is `internal`'s job. |
| **Two independent gates in the app** | `/book` only fetches internal services when the **server-read** profile role is `admin`, and that fetch uses the cookie-scoped client, so RLS applies to it as well. Tampering with the browser gets you an empty array. |
| **Never preselected** | `?service=guidance-verification` will not select it — `initial` resolves against the public catalogue only. It takes a deliberate click. |
| **Absent from every public surface** | Not in `/services`, not on the homepage, not in `sitemap.xml`, and `/services/guidance-verification` is a 404 even for you. The sitemap and `generateStaticParams` use the service-role client where RLS does *not* apply, so those two filter `internal` explicitly. |
| **15 minutes, not 45** | If a real client somehow lands in the slot, the cost is a quarter hour. |

There is nothing to remember to switch off. A temporary ₹1 service that someone
forgets to delete is a far worse outcome than a permanent hidden one.

---

## Before you start

- [ ] `RAZORPAY_KEY_ID` starts with `rzp_live_`, not `rzp_test_`
- [ ] `RAZORPAY_KEY_SECRET` is the live secret — regenerating the key ID without
      updating the secret is the single most common cause of a silent failure
- [ ] `RAZORPAY_WEBHOOK_SECRET` matches the secret on the **live** webhook in the
      Razorpay dashboard, not the test one
- [ ] The webhook URL in Razorpay points at `https://<your-domain>/api/payments/webhook`
- [ ] Events subscribed: at minimum `payment.captured` and `payment.failed`
- [ ] `NEXT_PUBLIC_SITE_URL` is the production URL **and you have redeployed**
      since setting it (`NEXT_PUBLIC_` values are baked in at build time)
- [ ] Your Razorpay account is activated, not still under review

---

## The run

1. Sign in as an admin on the production site.
2. Go to `/book`.
3. Under **1. Choose a consultation**, pick the dashed tile marked
   **Staff only · real payment** — *Astrological Guidance — ₹1 payment
   verification*.
4. Pick any slot. `min_notice_hours` is 0, so today works.
5. Fill in the details and pay with a real method. UPI is the quickest.

### What each stage proves

| Stage | What you should see | What it proves |
|---|---|---|
| Slot list loads | Times appear for the ₹1 service | `get_available_slots` works for it; the advisory-lock path is reachable |
| "Pay" opens Checkout | Razorpay modal, amount **₹1.00** | Live `RAZORPAY_KEY_ID` is valid, and the order was created **server-side** — the client never sends an amount |
| Payment completes | Redirect to the confirmation page | `/api/payments/verify` recomputed the HMAC-SHA256 signature and it matched. This is the check that makes payment success trustworthy |
| Appointment appears | Status **confirmed** in `/dashboard` | `confirm_appointment_payment()` ran and returned `confirmed` |
| Razorpay dashboard | Payment shows **Captured**, not Authorized | Auto-capture is on. An Authorized-not-captured payment auto-refunds after a few days |
| `/admin/payments` | The ₹1 row is present | The **webhook** arrived and its signature verified against the raw body. If everything above passed but this row is missing or stale, your webhook secret or URL is wrong — and that is exactly the failure test mode cannot show you |

### If the amount shown is not ₹1.00

Stop. The client is not allowed to send an amount — `/api/payments/order`
accepts a service ID and recomputes the price from the database. A wrong amount
means the wrong service row was used, not a display bug.

---

## Afterwards

**Refund it** from `/admin/payments` using the refund dialog, the same way you
would any payment. This is worth doing rather than absorbing the rupee: it
exercises `issueRefund` against live keys, so you find out now — not during a
real client's cancellation — whether refunds work.

Then **cancel the appointment** so the slot returns to the calendar.

The ₹1 will not settle to your bank as a separate line; it nets off. Razorpay
fees on ₹1 are a fraction of a paisa and round to nothing.

---

## When to re-run this

Any time the payment path could have changed underneath you:

- rotating Razorpay keys
- re-registering or re-pointing the webhook
- moving to a new domain (the webhook URL changes with it — see
  `docs/google-auth-setup.md` Part 3, which has the same trap)
- changing hosting provider or environment variables
- after any edit to `src/lib/payments/`

Keeping the service around is what makes re-running it a two-minute job instead
of a fifteen-minute setup you will skip.

---

## Removing it, if you ever want to

```sql
-- Hide without deleting (keeps payment history intact):
update public.services set bookable_online = false
 where slug = 'guidance-verification';

-- Full removal — fails if any appointment still references it, which is the
-- behaviour you want: it stops you erasing the service a real payment row
-- points at.
delete from public.services where slug = 'guidance-verification';
```
