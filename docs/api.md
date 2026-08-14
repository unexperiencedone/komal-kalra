# API Reference

All routes return the same envelope:

```jsonc
// success
{ "ok": true,  "data": { … } }

// failure
{ "ok": false, "code": "slot_taken", "message": "Human-readable.", "fields": { … } }
```

`code` is stable and machine-readable. `message` is safe to show a user verbatim.
Internal detail (Postgres errors, stack traces) is **logged server-side and
replaced** — a raw constraint message leaks schema information.

**Money in every payload is integer paise.** `210000` = ₹2,100.00.

The webhook is the one exception to this envelope: it returns bare
`{ ok: true }` because the consumer is Razorpay, not our own client.

---

## Common error codes

| Code | HTTP | Meaning |
|---|---|---|
| `validation_error` | 422 | Zod rejected the body. `fields` maps field → message. |
| `unauthorized` | 401 | No signed-in user. |
| `forbidden` | 403 | Signed in, but not permitted. |
| `not_found` | 404 | No such record, or not yours. |
| `slot_unavailable` | 409 | The slot was taken between display and request. |
| `slot_taken` | 409 | The `EXCLUDE` constraint fired — someone won the race. |
| `rate_limited` | 429 | Per-IP window exceeded. |
| `internal_error` | 500 | Logged with context; detail withheld. |

---

## Booking

### `GET /api/bookings/slots`

Available slots for a service. **Public** — the calendar must render for
anonymous visitors, because forcing signup before someone can see whether you
are free is a documented conversion loss.

| Param | Required | Notes |
|---|---|---|
| `serviceId` | ✅ | UUID |
| `from` | | ISO date. Defaults to now. |
| `days` | | Window length. Default 21, max 60 (server also caps the SQL at 92). |

```jsonc
{ "ok": true, "data": { "days": [
  { "date": "2026-08-18", "slots": [
      { "start": "2026-08-18T04:30:00Z", "end": "2026-08-18T05:15:00Z" }
  ]}
]}}
```

`Cache-Control: no-store`. Availability is the most time-sensitive data in the
product — a cached calendar showing a taken slot converts a visitor into a failed
booking, which is worse than a slower response.

A visitor's **own** live hold stays visible to them (matched on the
`kk_booking_session` cookie), so refreshing does not lock them out of the slot
they just picked. Everyone else's holds are excluded.

---

### `POST /api/bookings/hold`

Reserve a slot for the duration of checkout. **Anonymous allowed.**

```jsonc
// request
{ "serviceId": "uuid", "startsAt": "2026-08-18T04:30:00Z" }

// response
{ "ok": true, "data": {
  "holdId": "uuid",
  "startsAt": "…", "endsAt": "…", "expiresAt": "…",
  "ttlMinutes": 10
}}
```

Sets an httpOnly `kk_booking_session` cookie. That cookie is **not** an auth
token and grants nothing — it exists only so a visitor's own hold is
distinguishable from everyone else's.

Internally calls `create_slot_hold()`, which takes a transaction-scoped advisory
lock on the slot instant and re-checks availability **inside** the lock. Two
simultaneous requests for the same time serialise; exactly one wins.

**Errors:** `slot_unavailable` (409) is the normal outcome under contention, not
a server fault. Refresh the calendar and let the user re-pick.

Rate limit: 20 per 5 min per IP.

---

### `DELETE /api/bookings/hold?holdId=…`

Release a hold early so someone else can take the slot. Always returns 200.

---

### `GET /api/bookings/status?appointment=…`

Poll for confirmation. Used by the post-payment screen while waiting on the
webhook. **Requires auth**, and filters on `user_id` in addition to the guard —
this is polled from a page where the user is anxious about money, and it must not
be possible to watch someone else's booking by changing an id.

```jsonc
{ "ok": true, "data": { "id": "…", "status": "confirmed", "payment_status": "paid", "reference": "KK-100248" } }
```

---

## Payments

### `POST /api/payments/order`

Creates the appointment and the Razorpay order. **Requires auth.**

```jsonc
// request  — note: NO amount field exists
{
  "holdId": "uuid",
  "serviceId": "uuid",
  "details": {
    "fullName": "…", "email": "…", "phone": "…",
    "subjectName": "", "birthDate": "1994-03-12", "birthTime": "07:45",
    "birthPlace": "Ludhiana", "birthTimeKnown": true,
    "question": "…", "couponCode": "", "acceptTerms": true
  }
}

// response
{ "ok": true, "data": {
  "orderId": "order_abc123",
  "keyId": "rzp_test_…",        // publishable; safe in the browser
  "amountPaise": 210000,
  "currency": "INR",
  "appointmentId": "uuid",
  "reference": "KK-100248",
  "paymentId": "uuid",
  "prefill": { "name": "…", "email": "…", "contact": "…" }
}}
```

**There is no way to send an amount.** Price comes from `services.price_paise`,
the discount from a server-validated coupon *code*, tax from `TAX_BPS`. The total
is recomputed and asserted before an order is created.

Idempotent on `sha256(userId:holdId)` — a double-clicked Pay button or a retried
POST returns the **same** order rather than creating a second one.

Returns `503 payments_unconfigured` when Razorpay env vars are absent, with a
message directing the user to phone instead. Nothing fake is ever substituted.

Rate limit: 10 per 10 min per IP.

---

### `POST /api/payments/verify`

The fast confirmation path, called from the Razorpay Checkout handler.
**Requires auth.**

```jsonc
// request — all three values come from the BROWSER and are untrusted
{
  "razorpay_order_id": "order_abc123",
  "razorpay_payment_id": "pay_xyz789",
  "razorpay_signature": "hex…"
}
```

What happens, in order:

1. **HMAC check** — `HMAC_SHA256(key_secret, "order_id|payment_id")`, compared
   with `timingSafeEqual`. This is the only thing that makes the three values
   above mean anything. Without it, `{"razorpay_payment_id":"anything"}` would
   confirm a free booking.
2. **Ownership** — a valid signature proves the payment is real, not that it
   belongs to the person asking about it.
3. **Re-fetch from the Razorpay API** — the provider is the authority on amount
   and status, not the browser. A valid signature does not prove the payment was
   captured for the right amount.
4. **`settlePayment()`** — the same idempotent path the webhook uses.

```jsonc
{ "ok": true, "data": { "status": "confirmed", "appointmentId": "…", "reference": "KK-100248" } }
{ "ok": true, "data": { "status": "needs_attention", "appointmentId": "…", "message": "…" } }
```

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_signature` | 400 | Forged or corrupted. Nothing is recorded. |
| `not_captured` | 409 | Still in flight. The webhook will settle it. |
| `amount_mismatch` | 409 | Provider captured a different sum than we asked for. Never silently accepted. |

This endpoint is a **convenience, not the authority**. If it fails, the webhook
still confirms the booking — which is why the UI sends the user to a polling
screen rather than telling them their payment failed.

Rate limit: 30 per 5 min per IP.

---

### `POST /api/payments/webhook`

**The source of truth for money.** Called by Razorpay, never by our own client.

Configure in the Razorpay dashboard:

```
URL     https://your-domain.com/api/payments/webhook
Secret  RAZORPAY_WEBHOOK_SECRET   (a value YOU choose — NOT the API key secret)
Events  payment.captured   payment.failed   payment.authorized
        refund.created     refund.processed refund.failed
```

Processing order, and why each step is where it is:

1. **`await request.text()` before anything else.** The signature is HMAC-SHA256
   over the exact bytes received. The classic integration bug is a body parser
   mutating the body before verification. `JSON.parse` is never called on
   unverified bytes.
2. **Verify** → mismatch returns **401** and records nothing. Unverified bytes
   are not evidence.
3. **Insert into `payment_events`.** `UNIQUE (provider, event_id)` *is* the
   idempotency mechanism. A `23505` unique violation means this is a retry of an
   event already handled → return **200** immediately.
4. **Process** the event.
5. **Return 200 once durably recorded**, regardless of processing outcome. Razorpay
   retries on non-2xx; making it redeliver would not fix a bug in our own handler,
   and the reconciliation sweep repairs anything that failed.

Excluded from `proxy.ts`'s matcher: Razorpay sends no session cookie, so
refreshing one is pure latency on the most correctness-critical endpoint in the
system.

| Event | Effect |
|---|---|
| `payment.captured` | `settlePayment()` → confirm booking, queue confirmation + 24h reminder |
| `payment.authorized` | Recorded; moves to `processing`. Does **not** confirm — we auto-capture, so `captured` is the confirming event. |
| `payment.failed` | Frees the slot. **Refuses to un-confirm an already-paid booking** — out-of-order events are harmless. |
| `refund.created` / `refund.processed` | `record_refund()`. Also catches refunds issued from the Razorpay dashboard. |
| `refund.failed` | Marks the refund row failed. |

---

## Admin

### `POST /api/admin/refund`

**Admin only.** Authorisation is re-read from the database here — not inherited
from the fact that the caller loaded an `/admin` page. A crafted POST from a
signed-in *client* account is exactly the attack this guard exists for.

```jsonc
// request — omit amountRupees for a FULL refund (matches Razorpay's semantics)
{ "paymentId": "uuid", "amountRupees": 500, "reason": "Cancelled within free window" }

// response
{ "ok": true, "data": { "message": "…", "refundId": "rfnd_…", "refundedPaise": 50000 } }
```

Guards:
- `reason` is **required** — it is what makes the audit trail useful later.
- Amount validated against `amount_paise − amount_refunded_paise`.
- Idempotency key = `sha256(paymentId:amount:alreadyRefunded)`, sent to Razorpay,
  so a double-clicked button cannot issue two refunds.
- `admin_logs` entry written on **success and failure**.

| Code | Meaning |
|---|---|
| `not_refundable` | Payment is not `paid` / `partially_refunded`. |
| `amount_too_large` | Exceeds the remaining balance. |
| `already_refunded` | Nothing left. |
| `provider_error` | Razorpay rejected it. **Nothing has been refunded.** |

Ordering is deliberate: validate → call provider → record. Recording first would
leave the ledger claiming a refund that never happened. A crash between call and
record is corrected by the `refund.processed` webhook and the reconcile sweep,
because `record_refund()` is idempotent on the provider refund id.

---

## Leads

### `POST /api/leads`

Contact form. **Anonymous.**

```jsonc
{ "name": "…", "email": "…", "phone": "…", "message": "…", "serviceId": "", "website": "" }
```

Either `email` or `phone` is required, not both — insisting on both measurably
reduces submissions, and one reply channel is enough.

`website` is a **honeypot**: hidden from people, filled by bots. When it is
non-empty the endpoint returns a normal success response so the bot learns
nothing about the filter.

No CAPTCHA, deliberately: on a small practitioner's contact form it costs more
conversions than the spam it prevents, and deleting the occasional junk entry
from the admin Leads screen is a two-second job.

Rate limit: 5 per 10 min per IP.

---

## Scheduled jobs

Both require `Authorization: Bearer $CRON_SECRET`. Without `CRON_SECRET` set,
they **refuse to run in production** rather than silently exposing themselves.

### `GET|POST /api/cron/reconcile` — every 10–15 minutes

The safety net for a lost webhook. Without it, a customer who paid has no booking
and no automated route to getting one.

1. Re-fetches payments stuck in `created`/`pending`/`processing` for >15 min
   directly from the Razorpay API and settles from the authoritative source.
2. Expires abandoned holds, promoting those with contact details into **leads**
   rather than discarding a warm buyer.

```jsonc
{ "ok": true, "data": {
  "payments": { "checked": 3, "confirmed": 1, "failed": 1, "untouched": 1, "errors": 0 },
  "releasedHolds": 4
}}
```

### `GET|POST /api/cron/notifications` — every 1–5 minutes

Drains `notification_outbox`. Claims rows by flipping them to `sending` **before**
any network call, so two overlapping runs cannot double-send.

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reconcile",     "schedule": "*/10 * * * *" },
    { "path": "/api/cron/notifications", "schedule": "*/2 * * * *" }
  ]
}
```

---

## Database RPCs

Called only with the service-role key. Every one is `REVOKE`d from `anon` and
`authenticated` — leaving them executable would let any logged-in user create
bookings directly against PostgREST, bypassing the entire application layer.

| Function | Purpose |
|---|---|
| `get_available_slots(service, from, to, session_key)` | **The one exception** — granted to `anon`, because the public calendar needs it. |
| `create_slot_hold(...)` | Advisory lock + availability re-check + hold insert. |
| `release_slot_hold(...)` | Free a slot early. |
| `expire_stale_holds()` | TTL sweep + abandoned-booking → lead promotion. |
| `create_pending_appointment(...)` | The **only** way an appointment is created. Computes price server-side. |
| `confirm_appointment_payment(...)` | The idempotent transition. Returns a discriminated result. |
| `fail_appointment_payment(...)` | Frees the slot; refuses to un-confirm a paid booking. |
| `record_refund(...)` | Recomputes refund state from the ledger — duplicate delivery cannot inflate the total. |
| `revenue_summary` / `revenue_by_service` / `revenue_timeseries` | Aggregation in SQL, not in Node. |

### `confirm_appointment_payment()` results

```jsonc
{ "result": "confirmed",         "appointment_id": "…", "reference": "KK-100248" }
{ "result": "already_confirmed", "payment_id": "…" }   // replay — no side effects
{ "result": "slot_conflict",     "appointment_id": "…" } // paid, slot lost → needs_attention
{ "result": "amount_mismatch",   "expected": 210000, "received": 100 }
{ "result": "illegal_transition","from": "failed", "to": "paid" }
```

A discriminated result rather than an exception, because the caller must
distinguish "duplicate, fine" from "slot conflict, refund needed".
