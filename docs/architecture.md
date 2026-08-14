# Architecture

How this system is put together, and — more importantly — **why**. Every decision
here traces back to a finding in [`research.md`](./research.md).

---

## 1. The five rules everything else follows

1. **The server decides anything involving money or identity.** The client is a
   renderer. There is no request shape that lets a browser set a price, a role,
   or a payment status.
2. **The database enforces what must never be violated.** Application code is the
   second line of defence, not the first. Overlapping appointments are impossible
   because of an `EXCLUDE` constraint, not because of a careful `if` statement.
3. **Two independent confirmation paths, one idempotent state machine.** The
   browser handler and the webhook race each other safely because the transition
   itself is idempotent.
4. **Restraint is the differentiator.** No fabricated statistics, no fake
   urgency, no zodiac wheels.
5. **A feature must remove real weekly work for a solo practitioner**, or it is
   not built.

---

## 2. Stack

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js **16.3** (App Router) | `middleware` → `proxy`; async request APIs are mandatory |
| Language | TypeScript, `strict` | Money is `number` (paise), never `Decimal`/float |
| UI | React 19.2 Server Components + Tailwind CSS v4 | Client components only at interactive leaves |
| Primitives | Radix UI + CVA (shadcn-style, hand-rolled) | Only the primitives actually used |
| Forms | React Hook Form + Zod | Same schema client and server |
| Data | Supabase (Postgres 15+, Auth, RLS) | RLS on every table, no exceptions |
| Payments | Razorpay, behind a provider interface | Stripe is a new adapter, not a rewrite |
| Charts | Recharts, dynamically imported | Admin analytics only |

---

## 3. Directory layout

```
database/                  one .sql file per logical concern, numbered in dependency order
docs/                      research, architecture, api, progress
src/
├── proxy.ts               session refresh + optimistic redirects (NOT authorisation)
├── app/
│   ├── (marketing)/       public site — header/footer shell, zero client JS for content
│   ├── book/              booking funnel + confirmation
│   ├── login/             THE single login route
│   ├── dashboard/         client area  (requireUser in the layout)
│   ├── admin/             admin console (requireAdmin in the layout)
│   └── api/               route handlers — payments, bookings, leads, cron
├── components/
│   ├── ui/                design-system primitives
│   ├── marketing/ booking/ dashboard/ admin/ common/
├── lib/
│   ├── supabase/          client · server · admin · proxy  (four distinct clients)
│   ├── auth/              session.ts (pages) · api-guards.ts (route handlers)
│   ├── payments/          provider.ts · razorpay.ts · orders.ts · settle.ts · refunds.ts
│   ├── booking/           availability · holds · queries · errors
│   ├── notifications/     outbox (queue) · email (render + send)
│   ├── validation/        every Zod schema in the system
│   ├── content/           FAQ + legal copy
│   └── env · config · money · date · api · audit · rate-limit · utils
└── types/                 database.ts · razorpay.d.ts
```

**The rule that keeps this honest:** nothing in `app/` contains business logic.
Route handlers validate, authorise, delegate to `lib/`, and format a response.
Pages fetch and render. Anything that could be described as "how the business
works" lives in `lib/` or in a Postgres function.

---

## 4. The four Supabase clients, and when to use which

This is the single most important thing to understand before changing anything.

| Client | Key | RLS | Use for |
|---|---|---|---|
| `lib/supabase/client.ts` | anon | ✅ enforced | Client Components. The only one importable from `'use client'`. |
| `lib/supabase/server.ts` | anon + session cookie | ✅ enforced | **The default.** Server Components and actions scoped to the signed-in user. |
| `lib/supabase/admin.ts` | **service role** | ❌ **bypassed** | Webhooks, privileged RPCs, admin reads spanning all users. |
| `lib/supabase/proxy.ts` | anon | ✅ | Session cookie refresh in `proxy.ts` only. |

`server.ts` is the safe default because RLS does the ownership filtering for you —
a query that forgets `.eq('user_id', …)` still cannot return another client's
rows. `admin.ts` is marked `server-only`, so importing it into a Client Component
is a **build error**, which is the mechanism that keeps the service-role key out
of browser bundles.

**Every `createAdminClient()` call site must have already established
authorisation itself.** RLS is not going to do it there.

---

## 5. Authentication and the single `/login`

```
/login  ──▶ signInWithPassword
              │
              ▼
        read profiles.role  (server-side, service-role, from the DATABASE)
              │
      ┌───────┴───────┐
   admin            client
      │                │
   /admin          /dashboard
```

There is no `/admin-login`. There is no `/user-login`. Role is read from the
`profiles` table after authentication — never from the form, the session, or a
query parameter.

### The three-layer admin boundary

| Layer | File | Is it the security boundary? |
|---|---|---|
| Proxy redirect | `src/proxy.ts` | **No.** UX only. Next.js docs are explicit that proxy is for optimistic checks. |
| Page guard | `requireAdmin()` in `app/admin/layout.tsx` | **Yes.** Re-reads role from the DB every request. |
| API guard | `requireAdminForApi()` in every `/api/admin/*` | **Yes.** A crafted POST never reaches business logic. |
| RLS + `is_admin()` | Postgres policies | **Yes.** Even a leaked anon key cannot read other users' rows. |

### How an admin is created

There is **no application code path**. Not a hidden form, not an env var, not a
first-user-wins rule. Three independent mechanisms enforce it:

1. `handle_new_user()` hardcodes `role = 'client'` on signup.
2. `protect_profile_role()` raises `42501` if any non-service-role connection
   changes `role`.
3. No RLS policy grants a user write access to their own `role`.

Promotion is one line in the Supabase SQL editor. That is the whole design.

---

## 6. Money

**Every monetary value in this system is an integer number of paise.** In the
database, in API payloads, in React props. Rupee floats do not exist.

- Razorpay is paise-native — storing rupees means converting on every boundary.
- Floating-point rupees eventually produce a rounding bug in the one part of the
  system where being wrong costs actual money.
- `₹2,100.00` is `210000` everywhere.

There are exactly **two** conversion points, both at a human boundary:
- `lib/money.ts` — paise → display string, at render time.
- The admin service form — rupees typed by a person → paise, server-side.
  (Asking someone to type `210000` for a ₹2,100 service invites an expensive typo.)

### Price integrity

The client posts a `serviceId` and a `holdId`. **It never posts an amount.**

```
price   ← services.price_paise         (database)
discount← coupon validated server-side  (code posted, amount computed)
tax     ← TAX_BPS × net                 (server env)
total   ← recomputed and asserted in createBookingOrder()
```

If the recomputed total disagrees with the stored total, the booking **fails**
rather than charging an unverified amount.

---

## 7. Booking and the double-booking guarantee

The worst possible bug in this product is taking money for an appointment that
does not exist. Three independent layers make it structurally impossible.

```
Layer 1  SLOT HOLD                        (UX + first defence)
         create_slot_hold() takes pg_advisory_xact_lock(slot_instant)
         and re-checks availability INSIDE the lock.
         10-minute TTL, visible countdown.
                        │
Layer 2  CONDITIONAL CONFIRMATION         (idempotency)
         confirm_appointment_payment() UPDATEs with
         WHERE status = 'pending_payment'. A replay updates zero rows
         and fires no side effects.
                        │
Layer 3  EXCLUDE CONSTRAINT               (the actual guarantee)
         EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
           WHERE status IN ('pending_payment','confirmed','rescheduled')
         The database physically cannot store an overlap. Survives any
         concurrency, any application bug, any hand-written INSERT.
```

Slots are **derived, never materialised**: `get_available_slots()` computes them
from rules − exceptions − appointments − live holds at query time. There is
exactly one stored truth for "is this time taken" — the `appointments` table — so
the calendar can never disagree with reality.

### If a payment succeeds but the slot is lost

The money is **never** silently kept. The payment stays `paid`, the appointment
moves to `needs_attention`, the client sees an honest explanation with a phone
number, and the admin dashboard surfaces it in "Pending actions" with a one-click
refund.

---

## 8. Payment flow, end to end

```
 1  user picks service + slot
 2  POST /api/bookings/hold        → advisory lock, availability re-check, 10-min hold
 3  user enters details, signs in
 4  POST /api/payments/order       → create_pending_appointment() (price from DB)
                                   → Razorpay order (payment_capture: true)
                                   → payments row, status 'pending'
 5  Razorpay Checkout opens in the browser
 6  user pays
       │
       ├─ handler ──▶ POST /api/payments/verify
       │                • HMAC(key_secret, "order|payment") — timing-safe
       │                • ownership check
       │                • RE-FETCH from Razorpay API (provider is the authority
       │                  on amount and status, not the browser)
       │                • settlePayment()
       │
       └─ webhook ──▶ POST /api/payments/webhook           ← SOURCE OF TRUTH
                        • await request.text() FIRST, verify raw body
                        • INSERT payment_events (UNIQUE provider,event_id)
                            └─ 23505 → duplicate delivery → 200, stop
                        • settlePayment()
                        • always 200 once durably recorded

       └─ safety net ▶ /api/cron/reconcile  (every 10–15 min)
                        re-fetches anything stuck > 15 min from the provider
```

Both paths call the **same idempotent** `confirm_appointment_payment()`. Whichever
arrives first performs the transition; the second gets `already_confirmed` and
fires no side effects. That is what makes the race safe.

### Payment state machine

```
created ─▶ pending ─▶ processing ─▶ paid ─▶ refunded
              │           │          └───▶ partially_refunded ─▶ refunded
              │           └────────▶ failed
              └──────────────────────────▶ cancelled
```

Transitions are validated by `payment_transition_allowed()`. Illegal transitions
are **rejected**, not assumed impossible — Razorpay events can arrive out of
order (`payment.failed` after `payment.captured` on a retried card).

### Why webhooks must be idempotent

Razorpay retries on any non-2xx, so the handler **will** be invoked more than once
for the same event. `UNIQUE (provider, event_id)` on `payment_events` *is* the
idempotency mechanism — the handler attempts the insert first, and a unique
violation means "already handled". Do not relax that constraint.

### Why side effects are queued, never awaited

If confirmation email were sent inline from the webhook, an SMTP outage would
either lose the notification or make the handler return 500 — causing Razorpay to
redeliver the payment event indefinitely. Notifications go into
`notification_outbox` with a unique `dedupe_key` and are sent by a separate cron.

---

## 9. Security model

| Concern | Control |
|---|---|
| Row access | RLS on **every** table. Tables with RLS on and no policies deny everything to `anon`/`authenticated` — intentional for `slot_holds`, `payment_events`, `admin_logs`. |
| Secrets | `server-only` on `env.ts` and `admin.ts` makes client import a build error. No secret is `NEXT_PUBLIC_`. |
| Payment authenticity | Server-side HMAC with `timingSafeEqual`, then re-fetch from the provider API. Client state never confirms a payment. |
| Webhook authenticity | HMAC-SHA256 over the **raw body**, verified before `JSON.parse`. |
| Privilege escalation | `protect_profile_role()` trigger + no `role` write policy + `handle_new_user()` hardcodes `client`. |
| Column tampering | `protect_appointment_columns()` blocks a client changing price, times, or payment status even where an UPDATE policy exists. |
| Privileged RPCs | `REVOKE EXECUTE … FROM anon, authenticated` on every booking/payment/financial function. |
| `SECURITY DEFINER` | Every one pins `SET search_path = public, pg_temp`. |
| Refund abuse | Admin-only, reason required, amount validated against remaining balance, provider-side idempotency key, `admin_logs` entry on success *and* failure. |
| Open redirect | `/login?next=` and `/auth/callback?next=` accept only same-origin relative paths. |
| Audit | `admin_logs` is append-only: readable by admins, writable only by the service role. |
| Rate limiting | Per-IP fixed window on contact, holds, orders, verify, auth. **Honest scope:** in-memory and per-process. Defence in depth, not the primary control. Swap for Upstash Redis if you scale horizontally. |
| Card data | Never touches our servers. Razorpay Checkout collects it entirely within their PCI-DSS scope. |

---

## 10. Rendering strategy

Most routes render dynamically (`ƒ`), and that is deliberate rather than an
oversight:

- **Marketing pages** read live service pricing and approved testimonials from
  the database. A statically cached page that showed a stale price would be
  worse than a slightly slower one.
- **`/services/[slug]`** is pre-rendered per service (`●`) via
  `generateStaticParams`, revalidated when the admin saves a service.
- **`/login`, `/robots.txt`, `/sitemap.xml`, `/_not-found`** are static (`○`).
- **`/book`, `/dashboard`, `/admin`** are inherently per-user.

The performance work is therefore in **payload size**, not caching:
- Landing page ships **zero client JS for content** — only the header menu, FAQ
  accordion, contact form and sticky CTA are islands.
- Razorpay Checkout (~90 KB) is `lazyOnload` and **only** on `/book`.
- Recharts (~150 KB) is dynamically imported and **only** in admin analytics.
- Fonts self-hosted via `next/font` — no third-party font CDN request.

---

## 11. Notifications

```
event ──▶ queueNotification()  ──▶ notification_outbox (dedupe_key UNIQUE)
                                        │
                          /api/cron/notifications (every 1–5 min)
                                        │
                                  claim → render → send → mark sent
```

- **Email:** implemented (Resend). Without `RESEND_API_KEY` messages stay queued
  and are logged — the system degrades to "notifications pending" rather than
  pretending to have sent something.
- **In-app:** written directly to `notifications`, shown in the dashboard.
- **WhatsApp / SMS:** modelled as `channel` values but not wired. WhatsApp needs
  a Business API / BSP contract; SMS needs DLT template registration in India.
  Both drop in without schema changes.

Rows are claimed by flipping to `sending` **before** any network call, so two
overlapping cron runs cannot double-send.

---

## 12. Deliberate omissions

Things a bigger system would have, left out on purpose:

| Not built | Why |
|---|---|
| Redis / distributed rate limiting | Solo practice on one instance. Documented honestly rather than pretended. |
| Multi-practitioner scheduling | One calendar. Adding it would complicate every availability query. |
| Wallet / per-minute billing | Wrong business model (see research §1.1). |
| Generated PDF invoices | Print-optimised HTML is better here: works everywhere, no server toolchain, "Save as PDF" is one click. |
| Role hierarchy beyond admin/client | Two roles is the honest shape of this business. |
| Automatic refund on client cancellation | Refunds are queued for a human glance. Prevents a book-and-cancel abuse loop, and one solo practitioner can review every outgoing refund. |
| Dark mode | Doubles design/QA surface for an audience that skews to one-time daytime mobile visits. Token architecture makes it a contained change later. |

---

## 13. Where to make common changes

| Task | File |
|---|---|
| Change prices | Admin → Services (or `services` table). Never in code. |
| Change working hours | Admin → Availability |
| Change hold TTL | `src/lib/config.ts` → `BOOKING.holdTtlMinutes` |
| Change cancellation policy | `src/lib/config.ts` → `POLICY` (also flows into FAQ and legal pages) |
| Enable GST | `TAX_BPS=1800` in env |
| Add a payment provider | Implement `PaymentProviderAdapter` in `lib/payments/`, swap `getPaymentProvider()` |
| Add a colour / type token | `src/app/globals.css` `@theme` block — nothing hardcodes hex values |
| Change email copy | `src/lib/notifications/email.ts` → `renderEmail()` |
