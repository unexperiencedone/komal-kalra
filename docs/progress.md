# Progress

Status as of the initial build. Honest about what is finished, what is a
placeholder, and what is deliberately not built.

---

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | Research | ✅ Complete — [`research.md`](./research.md) |
| 2 | Product specification | ✅ Complete — [`architecture.md`](./architecture.md) |
| 3 | Design system | ✅ Complete — tokens in `src/app/globals.css`, primitives in `src/components/ui/` |
| 4 | Database | ✅ Complete — 20 files in `database/`, RLS on every table |
| 5 | Authentication | ✅ Complete — single `/login`, server-side role routing |
| 6 | Booking | ✅ Complete — holds, advisory locks, `EXCLUDE` constraint |
| 7 | Payments | ✅ Complete — orders, HMAC verification, webhooks, refunds, reconciliation |
| 8 | Dashboards | ✅ Complete — client + admin |
| 9 | Landing page & marketing | ✅ Complete |
| 10 | Security & QA | ⚠️ Static review done; **live payment testing outstanding** |
| 11 | Performance & SEO | ✅ Implemented; **Lighthouse not yet measured** |

---

## Verification actually performed

| Check | Result |
|---|---|
| `tsc --noEmit` (strict) | ✅ Clean, 0 errors |
| `next build` (Turbopack, production) | ✅ Clean, 35 routes generated |
| Route manifest | ✅ Proxy detected, `/services/[slug]` pre-rendered, app routes correctly dynamic |
| SQL hand-review | ✅ Caught and fixed a real bug: `generate_series` has no `time` overload |
| Secret-leak audit | ✅ No `NEXT_PUBLIC_` secret; `server-only` on `env.ts` and `admin.ts` |
| RLS coverage audit | ✅ All 17 tables have RLS enabled |
| Privileged-function audit | ✅ All booking/payment/financial RPCs revoked from `anon`/`authenticated` |

**Not verified, and I will not claim otherwise:**

- No Postgres instance was available in the build environment, so the schema was
  reviewed by hand rather than executed. Run `database/*.sql` in order against a
  real Supabase project before trusting it.
- No live Razorpay transaction has been run. The integration follows the
  documented flow and verifies signatures server-side, but **test it in Razorpay
  test mode before taking real money.**
- No Lighthouse run. The performance decisions are sound (zero client JS for
  landing content, code-split Checkout and Recharts, self-hosted fonts) but the
  numbers are unmeasured.
- No automated test suite. See "Recommended next steps".

---

## What is a placeholder

Everything here is **marked in the code or the database**. Nothing pretends to be
real.

| Item | Where | What to do |
|---|---|---|
| Service prices (₹1,500 – ₹2,600) | `database/19_seed.sql`, marked `-- PLACEHOLDER` | Confirm with Komal, edit in Admin → Services |
| Working hours (Mon–Sat 10–13, 16–19 IST) | `database/19_seed.sql` | Set the real hours in Admin → Availability |
| Biography | `/about` and the homepage About block, with a visible on-page placeholder notice | Replace with Komal's own words and real credentials |
| Portrait photograph | Homepage hero — renders a labelled placeholder box | Add `/public/komal-portrait.jpg` and replace the block |
| Email address | `src/lib/config.ts` → `BRAND.email` | Replace `consult@komalkalra.com` |
| Legal pages | `src/lib/content/legal.tsx`, with a header comment stating they are drafts | Have an Indian lawyer review, especially DPDP Act obligations |

**Phone numbers and the Instagram handle are real** — taken from the brief.

**There are no placeholder testimonials and no invented statistics.** That is
structural, not an oversight: the testimonials component returns `null` when
there are no approved reviews, and `TrustStrip` has no field for a made-up
number. The trust claims it does show ("Secure payment", "Free cancellation up to
24 hours") describe how the system actually behaves.

---

## Setup checklist

1. `npm install`
2. Copy `.env.example` → `.env.local`, fill in Supabase + Razorpay values.
3. Run `database/*.sql` **in numerical order** in the Supabase SQL editor.
4. `npm run dev`, sign up at `/login` with Komal's email.
5. Promote that account — the **only** way, by design:
   ```sql
   update public.profiles set role = 'admin' where email = 'her@email.com';
   ```
6. Razorpay dashboard → Webhooks:
   - URL `https://your-domain.com/api/payments/webhook`
   - Secret = your `RAZORPAY_WEBHOOK_SECRET` (**not** the API key secret)
   - Events: `payment.captured`, `payment.failed`, `payment.authorized`,
     `refund.created`, `refund.processed`, `refund.failed`
7. Add the two cron jobs (see `docs/api.md` → Scheduled jobs).
8. Replace the placeholders in the table above.

---

## Test before going live

Test mode first. In order of importance:

**Payments**
- [ ] Successful payment → booking confirms, email queues, receipt available
- [ ] Failed card → slot released, honest error, nothing charged
- [ ] Close the Checkout modal → slot still held, retry works
- [ ] **Kill the browser immediately after paying** → webhook still confirms the booking
- [ ] Replay a webhook (Razorpay dashboard → resend) → `{ok:true, duplicate:true}`, no second confirmation, no second email
- [ ] Tamper with `razorpay_signature` in devtools → `invalid_signature`, nothing recorded
- [ ] Full refund → status `refunded`, notification queued, `admin_logs` entry
- [ ] Partial refund → status `partially_refunded`, remaining balance correct
- [ ] Double-click Refund → exactly one refund

**Concurrency** (the one that matters most)
- [ ] Two browsers, same slot, both proceed → the second gets "no longer available"
- [ ] Two browsers, same slot, both reach Checkout → only one booking exists afterwards, the other is `needs_attention` with the money accounted for
- [ ] Let a hold expire → slot returns to the calendar, lead appears in Admin → Leads

**Authorisation**
- [ ] Client account visiting `/admin` → redirected to `/dashboard`
- [ ] `curl -X POST /api/admin/refund` as a client → **403**
- [ ] Try to change your own `role` via the Supabase JS client → **42501**
- [ ] Query another user's appointment via PostgREST with the anon key → empty
- [ ] `/login?next=https://evil.com` → ignored, no open redirect

**Everything else**
- [ ] Mobile booking flow end to end on a real phone
- [ ] Keyboard-only: tab through the slot picker, submit the booking form
- [ ] Reduced motion enabled → animations become instant

---

## Known limitations

| Limitation | Impact | If it matters |
|---|---|---|
| Rate limiting is in-memory, per-process | Degrades to per-instance behind multiple instances | Swap for Upstash Redis; the call signature is designed not to change |
| Business timezone hardcoded to `Asia/Kolkata` | Fine for an India-first practice | `business_timezone()` in SQL + `BUSINESS_TIMEZONE` in config are the two places to change |
| Reschedule is a request, not self-service | Komal confirms manually | Intentional — a single practitioner's calendar should not be silently rearranged |
| Coupon validation happens at appointment creation | A coupon cannot be previewed before that step | Add a `/api/coupons/validate` endpoint if it matters |
| No dark mode | — | Token architecture makes it a contained change |
| Email only | WhatsApp/SMS modelled but not wired | Needs a BSP contract / DLT registration in India |

---

## Recommended next steps

**Before launch**
1. Run the schema against real Supabase and execute the test checklist above.
2. Replace every placeholder in the table above.
3. Legal review of the three policy pages.
4. Razorpay account activation (needs the published legal pages).

**Soon after**
5. Error tracking (Sentry) — `/api/payments/webhook` and `settlePayment()` first.
6. Lighthouse run on `/`, `/services/[slug]`, `/book`.
7. Uptime monitoring on `/api/cron/reconcile` — a silently failing reconcile job
   means lost bookings nobody notices.

**When there is real traffic**
8. Integration tests for the payment state machine — the concurrency paths are
   the ones a refactor is most likely to break, and they are the most expensive
   to get wrong.
9. Review the booking funnel in Admin → Analytics. Below 25% completion means
   friction, not a demand problem.
