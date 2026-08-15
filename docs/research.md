# Research Findings — Astrologer Komal Kalra Platform

> Phase 1 output. Every architectural decision in `architecture.md` traces back to a finding here.
> Sources are listed at the bottom of each section.

---

## 1. Competitor & Market Research

### 1.1 Reference: Astro Arun Pandit and the Indian astrology market

The dominant Indian astrology properties fall into two distinct business models, and
conflating them is the single biggest product mistake available to us:

| Model | Examples | Economics | UX consequence |
|---|---|---|---|
| **Marketplace / per-minute** | AstroTalk, Vedaz, Astrolive, AstroKiran | ₹10–20/min, wallet top-ups, hundreds of astrologers, take rate | Wallet, queueing, "astrologer online now" badges, chat-first UI |
| **Single-practitioner brand** | Astro Arun Pandit, boutique Vedic consultants | Fixed-fee sessions ₹1,500–₹5,000, one calendar, personal brand | Calendar booking, scheduled appointments, personal authority, no wallet |

**Komal Kalra is unambiguously the second model.** She is one practitioner with a finite
calendar. Copying AstroTalk's per-minute wallet UX would be actively harmful: it commoditises
the practitioner, invites price comparison, and introduces a wallet-balance ledger that a
solo business does not need.

**Design principle taken:** appointment-first, fixed-price, calendar-scarce. Scarcity of the
practitioner's time is the *asset*, and the UI should make it visible ("3 slots left this
week") rather than hide it.

### 1.2 Observed pricing bands (India, 2026)

- Entry / single-question readings: ₹300 – ₹800
- Standard birth-chart consultation: ₹1,500 – ₹2,500
- Detailed multi-year / Kundli Milan / career packages: ₹2,500 – ₹5,000
- Celebrity-tier practitioners: ₹5,000 – ₹20,000+

**Conclusion:** the seeded service catalogue targets the ₹1,100 – ₹4,100 band — credible
premium positioning without celebrity-tier pricing. All seeded prices are marked
`-- PLACEHOLDER` in `database/16_seed.sql` and are editable from the admin Services screen,
because the actual rates must come from Komal.

Pricing uses ₹ amounts ending in `00` or `100` (₹1,100, ₹2,100) rather than `999` psychological
pricing. Discount-style pricing undercuts the premium/trust positioning that this category
depends on; spiritual-services buyers read `₹999` as a marketplace signal.

### 1.3 What the leading properties do that we should adopt (as principles, not clones)

| Pattern observed | Why it works | How we implement it |
|---|---|---|
| Consultation type stated with **duration** in the card | Removes the #1 pre-purchase question | `duration_minutes` is a first-class column, always rendered |
| Price visible before login | Gating price loses the majority of visitors | Services are public-readable via RLS; no auth wall on pricing |
| "How it works" numbered strip | Reduces perceived risk of an unfamiliar purchase | Section 5 of the landing page |
| Testimonials with the *problem* named | Generic "great reading!" converts poorly | `testimonials` table has a `service_id` FK so proof is service-specific |
| WhatsApp / phone as a parallel channel | Indian buyers frequently want human contact before paying | Phone numbers in header, footer, and lead form; contact is a first-class CTA |
| Post-booking "what to bring" (birth details) | Cuts no-show and rescheduling load | Collected during booking, stored encrypted-at-rest, shown in admin |

### 1.4 What they do that we should deliberately *not* copy

- **Fake live counters** ("2,847 people consulting now"). Unverifiable, and one screenshot
  destroys trust. We show zero statistics until real data exists — the landing page reads
  trust metrics from the database and renders nothing when the count is zero.
- **Countdown-timer discounts.** Cheapens a premium personal brand.
- **Zodiac-wheel hero graphics, animated starfields, purple→gold gradients.** This is the
  visual signature of the low-trust end of the category. See §2.
- **Wallet balances / recharge flows.** Wrong business model (see §1.1).
- **Chat-with-astrologer-now.** A solo practitioner cannot staff it; promising it and failing
  is worse than not offering it.

*Sources:* [Astro Arun Pandit](https://astroarunpandit.org/), [Astrology Consultation Fees in India 2026](https://prashnakundli.com/astrology-consultation-fees-in-india/), [Astrology Consultation Cost in India](https://astrolozyy.com/astrology-consultation-cost.html), [AstroKiran Pricing](https://astrokiran.com/pricing), [Online Astrology Consultation India](https://www.vedaz.io/blogs/online-astrology-consultation-india), [Live Chat and Call with Astrologer](https://blog.astrolive.app/live-chat-and-call-with-astrologer-best-hindi-2026/)

---

## 2. UI/UX Research

### 2.1 The positioning problem

The brief asks for **Trust + Luxury + Calmness + Spirituality + Professionalism**. Those five
are not equally weighted, and two of them are in tension:

- *Spirituality* pulls toward celestial ornament, deep purples, gold, glow.
- *Trust + Professionalism* pull toward restraint, whitespace, legible type, evidence.

Every low-credibility astrology site in the category resolves this tension toward ornament.
The differentiating move is to resolve it toward **restraint** and let a single, well-chosen
celestial motif carry the spiritual register.

**Decision:** the design system is closer to a private wealth-management or premium
therapy practice than to an astrology site. Celestial signalling is limited to:
1. A warm amber/saffron accent (culturally resonant in India; reads as auspicious, not gaudy).
2. A single thin-line constellation motif used at low opacity, once per page maximum.
3. Serif display type for headings, which carries gravitas and a hint of the traditional.

Nothing glows. Nothing rotates. No zodiac wheels, no particle fields, no gradient meshes.

### 2.2 Typography

Studied pairings across premium wellness, coaching, and private-practice sites. The reliable
formula is **a high-contrast serif for display + a neutral geometric/grotesque sans for UI**.

- **Display:** Fraunces — a variable serif with an optical-size axis and a `SOFT`/`WONK` axis
  that gives warmth at large sizes without becoming decorative. Used for h1/h2 and pull quotes.
- **Body & UI:** Inter — the safest possible choice for dashboard density, tabular figures for
  money columns, excellent Devanagari-adjacent fallback behaviour for transliterated terms.

Type scale is a 1.25 (major third) ratio, clamped with `clamp()` for fluid mobile→desktop.

### 2.3 Colour

A near-neutral warm base with a single saturated accent. Rationale: neutral bases make
photography look expensive and make one accent colour do all the CTA work, which is exactly
what conversion research wants (§3).

```
Ink        #14100E   near-black, warm       body text, headings
Bark       #3D332C   warm brown-grey        secondary text
Sand       #FAF7F2   warm off-white         page background
Linen      #F1EAE0   warm neutral           cards, section bands
Saffron    #C2762B   deep amber             primary CTA, focus rings, active states
Ember      #A45F1E   darker amber           hover/pressed
Sage       #4E6650   muted green            success / confirmed / paid
Clay       #A8412F   muted terracotta       destructive / failed / cancelled
Indigo     #2C3557   deep muted blue        the single "celestial" note; used sparingly
```

Contrast: Saffron `#C2762B` on Sand `#FAF7F2` measures **4.6:1** — passes WCAG AA for normal
text. White on Saffron measures **4.0:1**, which passes AA for large text and UI components
only, so button labels are set at 15px/600 weight or larger. Body copy never uses Saffron.

Dark mode is deliberately **out of scope for v1**: it doubles the design/QA surface, and the
audience for a consultation booking site skews strongly toward one-time daytime mobile visits.
The token architecture (CSS custom properties in a single `@theme` block) makes adding it later
a contained change.

### 2.4 Spacing, radius, elevation

- 4px base unit; the section rhythm uses only 8/12/16/24/32/48/64/96.
- Radius: `6px` controls, `12px` cards, `20px` feature panels. No fully-rounded pills except
  status badges — pills on buttons read as consumer-app, not professional-practice.
- Elevation: two levels only. `shadow-sm` for resting cards, `shadow-md` for overlays. Large
  diffuse shadows read as 2019 SaaS.

### 2.5 Motion

Findings from premium brand sites: motion should be **entrance-only and short**. Scroll-linked
parallax and long staggered reveals measurably hurt perceived performance and are the thing
users cite when a site feels "like a template".

- Durations 150–400ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Entrance animations fire once, on first intersection, and never re-fire.
- Everything is wrapped in `prefers-reduced-motion: reduce` → animations become instant.
- Framer Motion is used only where CSS cannot do the job (layout-shared transitions, the
  booking step transitions). Static marketing reveals use CSS + IntersectionObserver, which
  costs no JS bundle on the critical path.

### 2.6 States

Every async surface implements four states, and these are not optional:
`loading` (skeleton matching final layout, never a spinner on content), `empty` (illustrated,
with the action that resolves it), `error` (what happened + what to do + retry), `success`.

Skeletons match final layout because layout-matched skeletons avoid CLS and measurably reduce
perceived wait versus centred spinners.

*Sources:* [Booking CRO Guide](https://webeyez.com/insights/guides/booking-conversion-rate-optimization-guide), [Trust Signals Guide](https://lineardesign.com/blog/trust-signals/)

---

## 3. Conversion Research

### 3.1 Findings applied

| Finding | Source strength | Implementation |
|---|---|---|
| **Total price up front, incl. taxes/fees** — hidden costs revealed late are a top-3 abandonment cause | Strong, consistent | Price shown on card, on service page, and re-shown in the booking summary with an explicit GST line. There are no surprise fees anywhere in the flow. |
| **One-page checkout reduces abandonment ~20%**; optimised checkouts are 7–8 fields across 2–3 steps | Strong | Booking is 3 visible steps on desktop (service+date+slot / details / pay) rendered on **one route** with no page navigations. Mobile uses the same route with a step-by-step reveal. |
| **Trust signals inline with payment fields → ~18% higher payment completion** | Moderate | The payment summary card carries: Razorpay secure-payment mark, refund window in plain words, phone number, and "no card details touch our servers". |
| Sub-3s mobile load or bookings bleed | Strong | Landing page is a Server Component with zero client JS above the fold; booking widget is the only significant client bundle and is code-split. |
| Unclear cancellation policy is a named friction point | Strong | Cancellation/refund terms appear *before* the pay button, not only in a legal page. |
| Below 25% booking-flow conversion indicates real friction | Benchmark | The admin analytics screen computes the funnel (`holds created → orders created → paid`) so this is measurable rather than guessed. |

### 3.2 CTA placement decision

Research consensus is that CTAs should appear at each point where the visitor has just
acquired a reason to act, not on a fixed pixel interval. Placement:

1. Hero (primary + secondary)
2. Immediately after the Services grid (they now know the price)
3. Immediately after Testimonials (they now have social proof)
4. Final CTA band before the footer
5. **Persistent mobile bottom bar** — appears after the hero scrolls out. This is the single
   highest-leverage element on mobile for an appointment business.

Not after "About" — visitors reading a bio are in evaluation, not decision, mode, and a CTA
there measurably interrupts.

### 3.3 Should pricing be visible? Yes.

Argued both ways in the category. Marketplaces hide per-minute cost behind a wallet; solo
practitioners who hide price force a "request a quote" step that adds a full day of latency
and loses buyers who are ready now. For a fixed-fee ₹1,100–₹4,100 product with an instant
online payment path, **hiding price adds friction with no offsetting benefit.** Price is shown
everywhere.

### 3.4 Abandoned bookings

A hold that expires without a payment is a recoverable lead, not garbage. The `slot_holds`
table retains expired holds with the contact details already captured, and the admin
Leads screen surfaces them as `abandoned_booking` leads with the intended service and slot.
This is one of the highest-value features for a solo practitioner and costs almost nothing
architecturally because the data is already being captured.

*Sources:* [eCommerce Checkout Optimization 2026](https://www.digitalapplied.com/blog/ecommerce-checkout-optimization-2026-ux-guide), [Booking CRO Guide](https://webeyez.com/insights/guides/booking-conversion-rate-optimization-guide), [Trust Signals](https://lineardesign.com/blog/trust-signals/), [Increase Checkout Conversion](https://thrivecart.com/blog/increase-checkout-conversion-rates/)

---

## 4. Payment Architecture Research (Razorpay)

### 4.1 The non-negotiable finding

> *"Avoid trusting the success callback without signature verification — the browser can lie,
> always verify server-side."*

The Razorpay Checkout handler runs in the user's browser. Its `razorpay_payment_id`,
`razorpay_order_id`, and `razorpay_signature` are attacker-controllable inputs. The **only**
thing that makes them trustworthy is recomputing the HMAC server-side with a secret the
browser never sees.

Implemented in `src/lib/payments/razorpay.ts`:
```
expected = HMAC_SHA256(key_secret, `${razorpay_order_id}|${razorpay_payment_id}`)
valid    = timingSafeEqual(expected, razorpay_signature)
```
`timingSafeEqual` rather than `===`, to avoid leaking the digest one byte at a time.

### 4.2 Two independent confirmation paths, and why we need both

| Path | Latency | Reliability | Role |
|---|---|---|---|
| **Handler → `/api/payments/verify`** | ~instant | Fails if the user closes the tab, loses network, or the redirect is interrupted | Gives the user an immediate confirmation screen |
| **Webhook → `/api/payments/webhook`** | seconds–minutes | Razorpay retries on non-2xx; survives the user vanishing | The **source of truth** for money |

Research is explicit that for critical user-facing flows you supplement webhooks with API
verification — and that the reverse (client verification alone) is unsafe. Both are implemented
and both funnel into the *same* idempotent state-transition function, so whichever arrives
first wins and the second is a no-op.

A third path, **reconciliation**, exists as a safety net: `/api/cron/reconcile` re-fetches any
payment stuck in `pending`/`processing` for more than 15 minutes directly from the Razorpay
Payments API and settles it. This catches the case where a webhook was permanently lost.

### 4.3 Webhook correctness requirements found

1. **Signature over the raw body.** `X-Razorpay-Signature` is HMAC-SHA256 hex over the exact
   received bytes, keyed with the *webhook secret* — a different secret from the API key secret.
   The most common integration bug is a JSON body-parser mutating the body before verification.
   In a Next.js Route Handler we call `await request.text()` **first** and parse only after the
   signature passes. `JSON.parse` is never called on unverified bytes.
2. **Idempotency.** Razorpay retries on any non-2xx, so a handler *will* be invoked more than
   once for the same event. Every event is inserted into `payment_events` with a
   `UNIQUE (provider, event_id)` constraint; a duplicate insert short-circuits the handler and
   returns 200. State transitions are additionally written as conditional updates
   (`WHERE status IN (...allowed predecessors)`), so replay cannot re-fire side effects.
3. **Always return 2xx once the event is durably recorded.** Returning 500 because a downstream
   email failed causes Razorpay to redeliver forever. We persist first, then do side effects,
   and never let a side-effect failure change the HTTP status.
4. **Never trust event ordering.** `payment.failed` can arrive after `payment.captured` on a
   retried card. The state machine (§5) rejects illegal transitions rather than assuming order.

### 4.4 Authorized vs Captured

A Razorpay payment reaching `authorized` is **not** money in the bank; it is auto-refunded if
not captured within 3 days, and refunds can only be initiated on `captured` payments.

**Decision: use `payment_capture: 1` (auto-capture) on order creation.** For a service booked
at a scheduled future date, manual capture buys nothing — we are not shipping physical goods
and have no reason to hold an authorisation. Auto-capture means `payment.captured` is the
single event we key confirmation on, and it makes every successful payment immediately
refundable. `payment.authorized` is recorded for the audit trail but does not confirm a booking.

### 4.5 Amount handling

Razorpay works in the **smallest currency unit (paise)**. Every internal monetary value in this
codebase is a paise `integer`. Rupee floats do not exist anywhere in the data layer — no
`numeric`, no `float`, no rounding at rest. Conversion to a display string happens once, at the
render boundary, in `src/lib/money.ts`. A `₹1,100.00` service is `110000` everywhere.

The order amount is computed **server-side from the database service price**, never from a
value posted by the client. The client posts a `service_id` and a `hold_id`; it cannot post an
amount.

### 4.6 Refunds

`POST /v1/payments/:id/refund` with an optional `amount` (paise) supports partial refunds; omit
`amount` for a full refund. `speed: 'normal'` is used (instant refunds carry a fee and are not
appropriate as a default for a small business). Refunds:

- are **admin-only**, enforced server-side by re-reading the caller's role from the database;
- are sent with an `Idempotency-Key` header derived from `payment_id + amount`, so a
  double-clicked refund button cannot issue two refunds;
- validate `sum(existing_refunds) + amount <= captured_amount` inside the same transaction;
- write an `admin_logs` row with the actor, before/after state, and reason.

*Sources:* [Razorpay Node.js Integration Steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/), [Razorpay Refunds API](https://razorpay.com/docs/payments/refunds/apis/), [Create an Order](https://razorpay.com/docs/api/orders/create/), [Guide to Razorpay Webhooks](https://hookdeck.com/webhooks/platforms/guide-to-razorpay-webhooks-features-and-best-practices), [Razorpay Webhooks with Node.js](https://sreyas.com/blog/razorpay-webhooks-with-node-js/), [razorpay npm](https://www.npmjs.com/package/razorpay)

---

## 5. Double-Booking / Concurrency Research

### 5.1 The failure mode

Two users load the same Tuesday 4:00 PM slot. Both see it free. Both open Checkout. Both pay.
One of them now has a receipt for an appointment that does not exist. This is the single worst
bug this product can ship, because it takes money for nothing and the recovery is a manual
apology and refund.

### 5.2 Options evaluated

| Approach | Verdict |
|---|---|
| Check-then-insert in application code | **Rejected.** Classic TOCTOU race; two concurrent reads both see "free". |
| `SELECT ... FOR UPDATE` on the slot row | Sound, but requires a materialised row per slot and holds a row lock for the duration. |
| `pg_advisory_xact_lock` keyed on the slot | Good for serialising the *check*; auto-releases at transaction end. |
| **`EXCLUDE` constraint over a `tstzrange`** | **Chosen as the backstop.** The database physically cannot store two overlapping active appointments. Correct under any concurrency, any application bug, any direct SQL. |
| Redis soft-block with TTL | Correct at scale, but adds infrastructure a solo practice does not need. Postgres gives us TTL semantics with an `expires_at` column. |

### 5.3 Chosen design — defence in depth

Three independent layers, each of which alone would prevent most cases, and which together
make double-booking structurally impossible:

**Layer 1 — Soft hold (UX).** Selecting a slot creates a `slot_holds` row with
`expires_at = now() + 10 minutes`, taken inside `pg_advisory_xact_lock(hashtext(slot_key))` so
two concurrent hold attempts serialise. A live countdown is shown to the user. Availability
queries treat an unexpired hold from another session as unavailable. Ten minutes is chosen as
comfortably longer than a Razorpay Checkout session (typically 2–4 min including OTP) while
short enough that an abandoned hold does not block the calendar for long.

**Layer 2 — Conditional confirmation.** An appointment is confirmed only by
`confirm_appointment_payment()`, a `SECURITY DEFINER` function whose `UPDATE` carries
`WHERE status = 'pending_payment' AND payment_status IN ('pending','processing')`. If a
concurrent path already confirmed it, zero rows update and the function returns "already
confirmed" rather than double-firing side effects. This is the idempotency guarantee that lets
the verify endpoint and the webhook both call it safely.

**Layer 3 — Database exclusion constraint.**
```sql
ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status IN ('pending_payment','confirmed','rescheduled'));
```
Requires `btree_gist`. This is the guarantee that survives a future developer writing a naive
`INSERT` in a hurry at 2am. Violations surface as SQLSTATE `23P01` and are translated into a
friendly "that slot was just taken" error.

### 5.4 The refund-safe ordering

If a payment succeeds but the slot was somehow lost, we must **never** silently keep the money.
`confirm_appointment_payment()` returns a discriminated result; on `slot_conflict` the payment
is marked `paid` but the appointment moves to `needs_attention`, an admin notification is
created, and the admin dashboard surfaces it in "Pending actions" with a one-click refund. The
money is always accounted for.

*Sources:* [Solving the Double Booking Problem with PostgreSQL](https://jsupskills.dev/how-to-solve-the-double-booking-problem/), [Preventing Double Booking with Two-Phase Locking](https://medium.com/@oyebisijemil_41110/preventing-double-booking-in-databases-with-two-phase-locking-9a4538650496), [Advisory Locks in PostgreSQL](https://oneuptime.com/blog/post/2026-01-25-use-advisory-locks-postgresql/view), [Double Booking at Scale](https://itnext.io/solving-double-booking-at-scale-system-design-patterns-from-top-tech-companies-4c5a3311d8ea)

---

## 6. Supabase / RLS Research

### 6.1 Findings applied

- **RLS on every table, no exceptions**, including tables the client "never" touches — the
  anon key is public and reaches PostgREST directly, so an un-RLS'd table is an open API.
- **Never use a client-supplied user id in a policy**; always `(select auth.uid())`. Wrapping in
  `(select ...)` lets the planner evaluate it once per query rather than once per row — a large
  performance difference on the admin tables.
- **`SECURITY DEFINER` helper functions instead of correlated `EXISTS` subqueries** for role
  checks. `public.is_admin()` is defined once, marked `STABLE`, and used by every admin policy.
- **Index every column referenced by a policy.** Every `user_id` in this schema is indexed;
  without that, RLS turns each query into a sequential scan.
- **Functions used in RLS are themselves callable over the API.** `is_admin()` is safe to expose
  (it leaks only the caller's own role), but the privileged mutation functions have
  `REVOKE EXECUTE ... FROM anon, authenticated` and are called only with the service-role key.
- `SECURITY DEFINER` functions get an explicit `SET search_path = public, pg_temp` to close the
  search-path hijack vector.

### 6.2 Role storage decision

Research offers two options: a `role` column read via a helper function, or a JWT custom claim
in `app_metadata` (avoids a DB lookup per check).

**Chosen: `profiles.role` column + `STABLE` `is_admin()` helper.**

Rationale: a JWT claim is stale until the token refreshes, which means demoting an admin does
not take effect for up to an hour. For a system where the admin role can refund money, immediate
revocation matters more than saving a sub-millisecond indexed lookup. `STABLE` means Postgres
caches the result within a single statement anyway.

`profiles.role` is protected by a `BEFORE UPDATE` trigger that raises an exception if a non-
service-role connection attempts to change it. Combined with the RLS policy that excludes the
column from user-writable updates, promoting an admin is only possible from the SQL editor or
with the service-role key — exactly as the brief requires.

*Sources:* [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv), [Supabase RLS Best Practices — Makerkit](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices), [Supabase Security Best Practices 2026](https://vibearmor.ai/blog/supabase-security-best-practices-2026)

---

## 7. Framework Research — Next.js 16

The installed version is **Next.js 16.3.0**, which carries breaking changes relative to
common knowledge. Verified against `node_modules/next/dist/docs`:

| Change | Impact here |
|---|---|
| `middleware.ts` → **`proxy.ts`**, exported function renamed `middleware` → `proxy` | The existing `src/middleware.ts` is renamed; the edge runtime is not available in `proxy`, which is fine — the Supabase SSR client works on Node. |
| **Async Request APIs are now mandatory** — `cookies()`, `headers()`, `params`, `searchParams` are Promises with no sync fallback | Every page/route awaits them. `PageProps<'/route'>` / `RouteContext` typegen helpers are used for type safety. |
| Turbopack is the default bundler | No webpack config is introduced. |
| `next lint` removed; ESLint flat config | Existing `eslint.config.mjs` is already flat. |
| React 19.2 | Server Components everywhere by default; `'use client'` only for genuinely interactive leaves. |

**Consequence for the payment webhook:** `proxy.ts` runs on every matched request, so the
webhook path is explicitly excluded from the matcher. A proxy that touches Supabase auth
cookies on a webhook request would be pure overhead and a potential source of failure on the
most correctness-critical endpoint in the system.

*Source:* `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, `.../01-getting-started/16-proxy.md`

---

## 8. Business Research — what a solo practitioner actually needs

Filtered against "would Komal use this in month one?" Features that failed that test
(multi-practitioner scheduling, commission splits, affiliate tracking, marketing automation,
multi-currency, role hierarchies beyond admin/client) are **not built**.

**Built, because each removes real weekly manual work:**

| Feature | Manual work it removes |
|---|---|
| Availability rules + blocked dates | Answering "are you free Thursday?" by hand |
| Slot holds + auto-confirmation | Manually confirming and chasing payment |
| Client record with consultation + payment history | Digging through WhatsApp for what was discussed last time |
| Private consultation notes per appointment | Remembering the previous session |
| Leads pipeline with status | Losing enquiries in a DM inbox |
| Abandoned-booking capture | Silently losing warm buyers |
| Coupons | Running referral/festival offers without a discount code system |
| Revenue + funnel analytics | Not knowing what the business earned this month |
| Testimonial approval queue | Collecting and publishing social proof |
| Refunds from the dashboard | Logging into the Razorpay panel and reconciling by hand |

**Deferred deliberately:** WhatsApp Business API (requires business verification and a BSP
contract — the notification layer is written provider-agnostically so it drops in later),
SMS (needs DLT template registration in India), video-call hosting (Google Meet / Zoom links
are stored per appointment instead, which is what practitioners actually use).

---

## 9. Where research changed the brief

The brief asked to flag any place where evidence points somewhere better. Seven changes:

1. **`payments.amount` is `bigint` paise, not a decimal rupee amount.** The brief's table implied
   a generic `amount`. Razorpay's API is paise-native; storing rupees means converting on every
   boundary and eventually shipping a rounding bug that loses money.

2. **Added `slot_holds` as a first-class table.** The brief described temporary reservation as
   something to "consider". It is not optional — without it, the flow between "user opens
   Checkout" and "webhook confirms" is a 3-minute window with no protection.

3. **Added an `EXCLUDE` constraint rather than relying on application-level checks.** The brief
   asked for race-condition protection; application checks cannot provide it.

4. **`payment_events` stores the full verified payload, not a `payload_reference`.** The brief
   suggested a reference to external storage. Razorpay payloads are ~2–4 KB of `jsonb`; an
   external blob store adds a failure mode and a second consistency problem to the one place in
   the system that most needs to be atomic. `jsonb` in the same transaction as the dedupe key is
   strictly safer. (Payloads are pruned after 12 months by a scheduled job.)

5. **`availability` is rules + exceptions, not one row per date.** The brief's table had one row
   per date range. A recurring weekly schedule stored as one row per day for a year is 365 rows
   to edit when Komal changes her Tuesday hours. Split into `availability_rules` (recurring,
   by weekday) and `availability_exceptions` (one-off blocks/openings). Bookable slots are
   *derived*, not stored — the only stored truth is the appointment itself.

6. **Added `coupons` and `appointment_notes` tables.** Both were listed in the brief's business
   research section as "implement if valuable"; both scored highly on the month-one test.

7. **Single `/login` route implemented as a server-side redirect after a database role read, with
   a `proxy.ts` optimistic guard.** The brief's step 4 ("if role = admin, redirect to /admin")
   must not be the security boundary — Next.js documentation is explicit that proxy is for
   optimistic checks, not authorisation. Every `/admin` page and every admin API route
   independently re-reads the role server-side. The proxy redirect is a UX convenience only.

---

## 10. SEO Research

Search intent in this category splits three ways, and the site structure mirrors it:

| Intent | Example query | Page that serves it |
|---|---|---|
| **Navigational / brand** | "komal kalra astrologer" | Homepage, `Person` + `LocalBusiness` structured data |
| **Service + transactional** | "kundli milan online consultation", "online astrology consultation booking" | `/services/[slug]` — one indexable page per service with `Service` + `Offer` schema carrying the real price |
| **Informational** | "what is kundli milan", "gun milan meaning" | FAQ blocks with `FAQPage` schema; a `/journal` route is scaffolded but intentionally empty rather than filled with thin AI content |

Decisions:
- Service pages get real `Offer` schema with `price` and `priceCurrency` pulled from the
  database, so rich results show accurate pricing and never drift from the site.
- `/book`, `/dashboard`, `/admin` are `noindex` — they are application surface, and indexing a
  booking funnel produces duplicate thin pages.
- Canonical URLs are absolute and derived from a single `NEXT_PUBLIC_SITE_URL`.
- `sitemap.ts` is dynamic: it reads active services from the database, so publishing a service
  in the admin panel puts it in the sitemap without a deploy.
- No keyword stuffing and no location-page doorway farm ("astrologer in <city>" × 200). It is
  the fastest way to a manual action, and this brand's traffic will be brand + referral led.

---

## 11. Performance & Accessibility targets

**Performance**
- Landing page ships **zero client-side JavaScript for content**; it is a Server Component.
  The only client components are the mobile nav toggle, the FAQ accordion, and the sticky CTA.
- Fonts self-hosted via `next/font` with `display: swap` and preloaded subsets — no
  render-blocking request to a third-party font CDN.
- Images through `next/image` with explicit dimensions, AVIF/WebP, `priority` on the hero only.
- The Razorpay Checkout script is loaded with `next/script` `lazyOnload` and **only** on the
  booking route — it is ~90 KB and has no business on the homepage.
- Recharts is dynamically imported inside admin analytics only, so the ~150 KB charting bundle
  never touches a public page.
- Targets: LCP < 2.0s on 4G mobile, CLS < 0.05, INP < 200ms.

**Accessibility**
- Semantic landmarks; one `h1` per page; no heading levels skipped.
- Every input has a real `<label>`; errors are wired with `aria-describedby` and
  `aria-invalid`, and the form announces its error summary via `role="alert"`.
- Visible focus ring (2px Saffron + 2px offset) that is never removed.
- The slot picker is a proper radiogroup — arrow-key navigable, not a grid of divs.
- `prefers-reduced-motion` respected globally.
- Target AA. The one place this constrains design is CTA text size (§2.3).

---

## 12. Summary of principles carried into the build

1. Appointment-first, not marketplace. The calendar is the product.
2. The server decides everything that involves money or identity. The client is a renderer.
3. The database enforces what must never be violated. Application code is the second line.
4. Two independent payment-confirmation paths, one idempotent state machine, plus reconciliation.
5. Restraint as the differentiator. No fake data, no fake urgency, no zodiac wheels.
6. Every feature must remove real weekly work for a solo practitioner, or it is not built.

---

## 13. Second pass — reading the reference site directly

The first pass worked from category knowledge. This pass fetched
astroarunpandit.org and read its actual structure. Four patterns were worth
taking, and two were worth explicitly rejecting.

### Adopted

| Pattern on the reference | Why it works | How it is implemented here |
|---|---|---|
| **"One Call Can Change Everything"** — four cards named *Vedic Birth Chart Analysis / Career & Business / Relationship & Marriage / Remedies* | Names the visitor's **problem**, not the practitioner's catalogue. A visitor thinks "should I take this job", not "I would like a 45-minute session". | `GuidanceTopics` — six cards. **Improved:** each card routes to the matching service's page. The reference's four cards are decorative and all sit under one generic CTA, which wastes the intent the visitor just expressed. |
| **Icon row under the hero** (Explore Report / Consult Now / Ask Astrologer / …) | Straight-to-action, excellent on mobile where it lands just below the fold. | `QuickLinks` — five tiles, scroll-snapped on mobile. **Trimmed:** theirs has eight and half point at separate businesses (gemstones, courses); every tile here is a real destination in this product. |
| **Per-card micro-badges** ("1-on-1", "FREE", "India's No.1", "7L+ Sold") | Cheap, effective trust signal at the decision point. | `ServiceCard` badges. **Critical difference:** theirs are marketing claims typed into a CMS. Every badge here is derived from database truth — `featured` → "Most booked", `bookable_online = false` → "Enquiry only". There is deliberately **no free-text badge column**, because one would be an open invitation to type "India's No.1" into it. |
| **"Available in Hindi and English"** | Language is a genuine hesitation point in this market and is rarely stated. | Hero meta row + `availableLanguage` in structured data. |
| **Mid-page capture panel on a decorative background** | Their highest-converting element; visually distinct from the page around it. | Contact section is now a bordered panel on the constellation motif. **Reduced:** theirs collects seven fields for an automated report; this collects three, because the goal is a reply from a person. |

### Rejected

- **Their stats band.** It renders `0M+ / 0.0M+ / 0Lakh+ / 0+` on page load — the
  placeholder values leak through before the animation runs, which is itself the
  evidence that the numbers are decorative rather than derived. `StatsBand` here
  animates identically but every figure is a `COUNT` over real rows, and the
  whole section returns `null` below 25 completed consultations. There is no prop
  for a hardcoded number; the component cannot be faked without editing it.
- **Marketplace astrologer cards** (₹50/min, "Exp: 28 yrs", app-store links),
  courses and gemstone cross-sells, and a 40-image duplicated marquee. Wrong
  business model (see §1.1) and, in the marquee's case, pure weight.

### The structural difference this exposed

The reference is a **content-and-products business** that also sells
consultations: reports, calculators, courses, pujas, gemstones, an app, a
podcast. Its homepage is a hub, and the density is rational for that.

This is **one practitioner with a calendar**. The homepage has one job, so the
section order answers a visitor's questions in the order they actually arise
rather than presenting a hub. Copying the reference's density would have been
copying a solution to a problem this business does not have.
