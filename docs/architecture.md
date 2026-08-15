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

---

## 14. Colour system — rules that are enforced, not just documented

The palette (`src/app/globals.css`) is not a swatch list; three of its rules are
mechanically checked.

### The band/motif collision — read this before touching `.band-*`

Section grounds set `background-color` and `background-image` **separately**, and
the star motif composes on top through a compound selector:

```css
.band-night                            { background-color: …; background-image: var(--gradient-night); }
.band-night.constellation-motif-dark   { background-image: var(--motif-dark), var(--gradient-night); }
```

The first version used the `background` shorthand on `.band-night` and a separate
`.constellation-motif-dark { background-image: … }`. Applying both classes meant
the motif **erased** the band's gradient — the section rendered with no ground,
the page's cream showed through, and every piece of light text on it became
invisible at roughly 1.1:1.

It typechecked. It built. Nothing caught it but a screenshot. If you add a band
or a motif variant, add the compound rule too.

### Saffron is never a button fill

White on saffron `#C2762B` is **3.55:1** — acceptable for large display type,
a failure for a 15px semibold label. `--color-ember` `#A45F1E` (4.96:1) fills
buttons; `--color-ember-text` `#8F5219` (5.5–6.2:1) carries accent text on light
grounds. Saffron is for icons, rules and large display type only.

### Light text belongs to a variant, not to an inline override

`<Button variant="onDark">` exists because the ad-hoc
`className="border-white/25 text-[var(--color-sand)]"` version is what shipped an
invisible button when the band beneath it lost its ground. A named variant makes
the requirement legible at the call site.

### `npm run audit:contrast`

Parses every `className` in `src/`, finds foreground/background token pairs on
the same element, resolves both against the tokens **read from `globals.css`**,
and fails on anything under 4.5:1.

Two things it gets right that a naive version does not:

- **State variants are paired.** `group-hover:bg-X` is measured against
  `group-hover:text-Y` when one exists, so hover-inverting buttons do not
  produce false positives.
- **Opacity-modified backgrounds are skipped.** `bg-white/[0.08]` is a
  translucent overlay whose effective colour depends on what is behind it and
  cannot be judged from the class alone.

Both matter for the same reason: an audit that cries wolf stops being read, and
is then worse than no audit. It found three genuine faults on first run,
including a saffron-filled sticky mobile CTA at 3.55:1 — the most-tapped button
in the product.

---

## 15. Design system — "Silent Luxury" (current)

The visual layer was replaced wholesale from the supplied Stitch design files
(`stitch_komal_kalra_brand_design_system/`). **The backend was not touched**:
schema, RLS, booking locks, Razorpay flow, auth and all API routes are
unchanged. This was a re-skin plus a restructure of the marketing pages.

### The three rules that define it

| Rule | Consequence |
|---|---|
| **0px radius everywhere** | `--radius-control/card/panel` are all `0px`. Circles survive in exactly two places: avatars and the numbered booking-step markers, where roundness carries meaning. |
| **No shadows** | Depth is tonal (Ivory → Linen → Navy) plus 1px hairlines. The default border colour is Muted Gold at 20%. A `box-shadow` anywhere in this system is a bug. |
| **Gold accents, navy fills** | Muted Gold is hairlines, eyebrows and small icons. Cosmic Navy fills every button. |

### Palette

```
Cosmic Navy  #1a1f2c   grounding, button fill, footer        white on it  16.5:1
Ink Black    #17120e   button hover, deepest ground
Warm Ivory   #fef9f2   the canvas
Linen Grey   #ece7e1   editorial card fill
Muted Gold   #a45f1e   hairlines / icons / eyebrows-on-ivory
```

**Gold exists in three measured weights**, because one gold cannot serve every
ground and pretending otherwise is how an accent ends up illegible:

| Token | On ivory | On linen | On navy | Use |
|---|---|---|---|---|
| `muted-gold` | 4.73 ✓ | 4.03 ✗ | 3.32 ✗ | hairlines, icons, eyebrows on ivory |
| `gold-deep` | 6.18 ✓ | 5.27 ✓ | — | accent **text** on light grounds |
| `gold-light` | — | — | 8.58 ✓ | accent **text** on navy/ink |

### Typography

Playfair Display (500/600) for headings, Public Sans (400/500/600) for body and
UI. "Label Caps" — 12px/600 at 0.12em tracking, uppercase — is used for every
button label, eyebrow and table header, and is why buttons carry generous
horizontal padding.

### Imagery

`src/lib/content/imagery.ts` catalogues all 15 photographs with their real alt
text from the design files, behind an `img()` accessor.

**Before launch:** run `npm run images:download`, then flip `USE_LOCAL_IMAGES`
to `true`. The Stitch URLs are Google-hosted and can rotate without warning;
they are a development convenience, not a hosting strategy. Nothing else needs
to change — every call site goes through `img()` or `serviceImage()`.

### What the redesign removed

`QuickLinks`, `TrustStrip`, `GuidanceTopics`, `StatsBand` and `StickyCta` are
gone, along with `lib/content/topics.ts` and `lib/marketing/stats.ts`. The
Silent Luxury home page is six sections, not twelve — the aesthetic depends on
"intentional whitespace to evoke exclusivity", and keeping the denser
conversion furniture would have contradicted the whole direction.

One consequence worth stating plainly: the real-data stats band is gone, so the
honesty guarantee it enforced now rests on the testimonial components alone.
Those still render nothing without an approved review, and there is still no
hardcoded testimonial anywhere in the codebase.

---

## 16. The Rashi Chakra watermark

A brass zodiac wheel fixed behind the homepage, rotating as the page scrolls.

### The source file needed fixing first

`public/images/watermark.png` has **no alpha channel** — 3 channels, 1.83 MB.
What looks like transparency is the editor's checkerboard rendered into the
pixels. Used directly it renders a grey checkered square.

`npm run watermark:prepare` keys it out and writes
`public/images/watermark-mark.webp` (235 KB, real alpha). The key uses
*saturation*, not brightness:

```
background  ⟺  max(r,g,b) − min(r,g,b) < 14   AND   max(r,g,b) > 185
```

The background is strictly neutral (r = g = b); the brass is strongly warm
(166,141,100 at centre). A flat brightness cut would have eaten the brass
specular highlights, which are bright but never neutral. A 10-unit feather band
ramps alpha so the cut edge is not aliased. The original PNG is left untouched.

### The rotation runs on the compositor

Primary path is a native CSS scroll-driven animation:

```css
@supports (animation-timeline: scroll()) {
  .watermark-scrub { animation: watermark-rotate 1s linear both;
                     animation-timeline: scroll(root block); }
}
```

Zero JavaScript, driven off the scrollbar, running on the compositor.
`ScrollWatermark.tsx` carries a rAF-coalesced fallback that **only attaches
when `CSS.supports('animation-timeline: scroll()')` is false** — where support
exists, this component ships no runtime work at all. This matters because the
element is on screen for the whole page, and scroll-linked JS runs on every
frame.

### z-index −1, not 0

A positioned element at `z-index: 0` paints in step 6 of the stacking order —
**above** block backgrounds and above inline text. At `z-0` the mark would sit
on top of every paragraph. At `−1` it paints in step 2: above the `<body>`
background, below all content.

The consequence is that any section with its own opaque background hides it. The
homepage's two ivory sections therefore carry **no** background class —
`band-ivory` is the same colour as the body, so dropping it is visually neutral
and lets the mark through. The hero, the tonal bands and the navy sections stay
opaque, which gives the mark a rhythm of appearing and receding rather than
being permanently on screen.

### Accessibility

`aria-hidden`, empty `alt`, `pointer-events: none`, `select-none` — never in the
accessibility tree, the tab order, or a text selection.

Under `prefers-reduced-motion` it **stops**, rather than snapping to its end
rotation. `animation: none !important` is required because the blanket
reduced-motion rule only shortens `animation-duration`, and a scroll-driven
animation has no duration to shorten. A slowly turning element in the periphery
is a classic vestibular trigger and it carries no information, so holding it
still loses nothing.

At 6% opacity over Warm Ivory it sits far below any text it passes behind, so it
cannot affect the ratios `npm run audit:contrast` enforces.

---

## 17. Image resolution and upscaling

### The situation

Every photograph in `public/images` came down at **512px wide**. The hero renders
full-bleed at `100vw`, so a 1440px retina viewport needs roughly **2880px** — the
browser is currently stretching the source about 5.6×. That is the single most
visible quality problem on the site.

### Fix the source before reaching for an upscaler

The Stitch URLs are served by Google's image CDN, which accepts a size suffix on
the path. `=s0` returns the **original, unsampled** image. The first version of
`download-images.js` fetched the bare URL, which is why it got thumbnails.

`npm run images:download` now tries a ladder — `=s0`, `=w2560`, `=w2048`, bare —
keeps whichever returns a meaningfully larger file, and prints the resulting
dimensions so the outcome is visible rather than assumed.

**Run this first.** Real pixels from the source always beat pixels invented by a
model, and it costs nothing.

### Only then, upscale what is genuinely stuck

If `=s0` still returns 512px, the original really is that size and upscaling is
the right call.

| Tool | Best for | Notes |
|---|---|---|
| **Topaz Gigapixel** | Photographic fidelity — the portraits | Strongest face and skin recovery at 4–8×. Paid, runs locally, no upload. The right choice for `heroImage` and `practitionerPortrait`, where an invented face is unacceptable. |
| **Upscayl** | Everything else, free | Open source, runs locally, no upload and no per-image cost. Measurably behind Topaz on fidelity but well ahead of other free options. Fine for the still-life and texture shots. |
| **Magnific AI** | Creative reinvention | *Invents* detail rather than recovering it. Credit-priced and it adds up. **Avoid for the portraits** — it will confidently alter a face, and this site puts a real practitioner's name next to it. |

### Rules for this project

1. **Never run a generative upscaler on a photograph of a person** whose likeness
   the brand depends on. Recovery models (Topaz "Standard"/"Recovery", Upscayl's
   photo models) reconstruct; creative models fabricate.
2. **Target 2× the largest rendered size**, not the maximum the tool offers.
   The hero needs ~2880px. Upscaling to 8000px only inflates the repository —
   `next/image` will downscale it anyway.
3. **Re-run `npm run watermark:prepare`** if the watermark is ever re-exported;
   the alpha key has to be redone.
4. **Keep sources as they arrive.** `next/image` handles format and size at
   request time, so there is no reason to pre-compress and lose headroom.

### What is already handled

Delivery is not the problem — `next/image` already emits AVIF/WebP at the right
size per breakpoint, and `formats: ['image/avif', 'image/webp']` is set in
`next.config.ts`. The only missing ingredient is source resolution.

---

## 18. Typography (current)

**Cormorant Garamond** (display) + **Inter** (body/UI), replacing Playfair
Display + Public Sans.

### Why the change

Playfair is the most over-used serif on the web — it reads as a default rather
than a decision, and its Didone contrast is a fashion-magazine register rather
than a heritage one. Cormorant is a **Garamond revival**: old-style, warmer,
and the actual serif lineage luxury houses draw on. It also ships a **true
italic**, which the `/about` pull quote needs — a synthesised oblique is
obvious at 34px.

Inter replaces Public Sans for two concrete reasons: better small-size
rendering, and `tnum` figures, which the payments and revenue tables rely on to
keep digits vertically aligned.

### What had to change with the face swap

Swapping a display serif is never just a variable rename. Three adjustments
were required:

| | Playfair | Cormorant | Why |
|---|---|---|---|
| **Scale** | 40–72px | 44–80px | Cormorant has a much smaller x-height, so it *reads* smaller at the same point size. Keeping the old values would have silently shrunk every heading. |
| **Weight** | 500 | **600** below ~32px | Cormorant is drawn light. At 500 the thin strokes disappear against ivory. |
| **Tracking** | −0.025em | −0.015em | An old-style face has generous counters already. Pulling it in as hard as a Didone wants jams the hairlines together. |

### Supporting typographic work

- **Reading measure as tokens.** `--measure: 68ch`, `--measure-tight: 46ch`,
  `--measure-wide: 78ch`. Line length is the most under-attended typographic
  variable — under ~45 characters the eye jumps lines, over ~80 it loses the
  return sweep. `ch` units track the type size automatically.
- **`.prose-editorial`** for long-form copy: constrained measure, paragraph
  spacing in `em` so it scales with type size, `text-wrap: pretty` everywhere.
- **`.standfirst`** and **`.pull-quote`** as named classes, so the opening
  paragraph and the quote are consistent rather than re-specified per page.
- **`font-optical-sizing: auto`** — both faces are variable with an `opsz` axis,
  so 80px and 20px are genuinely different drawings rather than one scaled.
- **Per-size heading tracking** rather than one global letter-spacing, which is
  the most common way a good pairing ends up looking amateur.
- **`hanging-punctuation: first last`** so quotes and hyphens hang into the
  gutter and the text edge reads optically straight.

### Fallback stack

`Cormorant Garamond, Garamond, Georgia, ui-serif, serif`. Georgia is deliberate:
it is the closest widely-installed old-style serif, so the swap during font load
is far less jarring than falling back to a generic `serif`.
