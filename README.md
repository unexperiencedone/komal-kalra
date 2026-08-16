# Astrologer Komal Kalra — Consultation Platform

A production booking and payment platform for a single-practitioner consultation
business. Clients browse services, pick a time, pay online, and manage their
bookings; Komal runs the practice — calendar, clients, revenue, refunds — from an
admin console.

**Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + RLS) · Razorpay**

---

## Documentation

| Document | What is in it |
|---|---|
| [`docs/research.md`](docs/research.md) | Competitor, UX, conversion, payment and concurrency research, and the seven places the evidence changed the brief |
| [`docs/architecture.md`](docs/architecture.md) | How the system works and why each decision was made |
| [`docs/api.md`](docs/api.md) | Every endpoint, error code and database RPC |
| [`docs/progress.md`](docs/progress.md) | Status, placeholders, setup checklist, pre-launch tests |
| [`database/README.md`](database/README.md) | Schema files and the order to run them |
| [`docs/google-auth-setup.md`](docs/google-auth-setup.md) | Google sign-in setup, and how to brand the consent screen |
| [`docs/legal-compliance.md`](docs/legal-compliance.md) | DPDP / Razorpay / Google obligations, and what still needs a lawyer |
| [`docs/legal/`](docs/legal/) | The four legal documents as markdown (generated) |

---

## Quick start

```bash
npm install
cp .env.example .env.local        # fill in Supabase + Razorpay
# run database/*.sql in numerical order in the Supabase SQL editor
npm run dev
```

Then sign up at `/login` and promote yourself once, from the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

There is **no application code path** that can create an admin. That is
deliberate and enforced three ways — see `database/03_profiles.sql`.

---

## What is worth knowing before you change anything

**All money is integer paise.** In the database, in API payloads, in props.
`₹2,100.00` is `210000`. Razorpay is paise-native, and rupee floats eventually
produce a rounding bug in the one part of the system where being wrong costs
money. `src/lib/money.ts` is the only place paise become a display string.

**The client never sends an amount.** It sends a `serviceId` and a `holdId`.
Price, discount and tax are all computed server-side and asserted before an order
is created.

**Double-booking is prevented by the database, not by application code.** An
`EXCLUDE USING gist` constraint on `appointments` means overlapping bookings
cannot be stored, under any concurrency, from any client. Do not drop it.

**Webhook idempotency is a `UNIQUE` constraint.** `payment_events (provider,
event_id)` is what makes Razorpay's retries safe. Do not relax it.

**`proxy.ts` is not the admin security boundary.** It is a UX redirect. Every
`/admin` page and every `/api/admin/*` handler re-reads the caller's role from
the database.

---

## Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

---

## Status

Typecheck and production build are clean. The schema was reviewed by hand (no
Postgres was available in the build environment) and no live Razorpay transaction
has been run — **test in Razorpay test mode before taking real money.**

Placeholder content (prices, biography, portrait, legal pages) is listed and
marked in [`docs/progress.md`](docs/progress.md). There are no fabricated
testimonials or statistics anywhere in the codebase, by construction.
