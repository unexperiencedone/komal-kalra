# Antigravity refactor prompt

Paste everything between the rulers into Antigravity. It assumes the repo is
open and `docs/design-refactor.md` is present — the prompt refers to it rather
than repeating it, which keeps the agent reading the spec instead of a summary
of the spec.

The palette is now read from screenshots of the live site and written into the
prompt directly, so there is no sampling step. If a token looks subtly off once
it is running in a browser, trust the browser and correct the token.

---

## The prompt

---

You are refactoring a production astrology consultation platform —
**Astrologer Komal Kalra** — from its current "Silent Luxury" design system to
the saffron/devotional visual language of https://astroarunpandit.org.

**Read `docs/design-refactor.md` first, in full, before writing any code.** It
contains the researched page structures, the token spec, the tone-of-voice
mapping, the route strategy and the motion inventory. This prompt tells you how
to execute; that document tells you what to build. Where they disagree, the
document wins.

### What this codebase is

Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase (Postgres, Auth,
RLS) · Razorpay. It takes real money from real clients. It is not a template.

### Hard constraints — violating any of these is a failed refactor

1. **Payments are real and must stay real.** Razorpay orders are created
   server-side; the client never sends an amount; success is established by
   HMAC-SHA256 signature verification plus a webhook, never by client state.
   Do not touch `src/lib/payments/**` or `src/app/api/payments/**`. If a visual
   change appears to require a change there, stop and report instead.
2. **Do not build a mock or simulated payment path**, even temporarily, even
   for testing. A ₹1 admin-only verification service already exists for that —
   see `docs/payment-verification.md`.
3. **Auth stays Supabase.** 16 RLS policies key on `auth.uid()`. Introducing a
   different session mechanism makes `auth.uid()` return null and silently
   disables every ownership policy in the database.
4. **Never hardcode admin privileges in client-reachable code.** Roles are read
   from the profile on the server.
5. **Money is integer paise.** Never a rupee float, anywhere.
6. **Never filter on `internal` or `archived_at` inside a PostgREST query.**
   Use `.filter()` on the returned rows instead. A `.eq()` against a column the
   deployed database may not have yet returns 400, and the error handling
   silently produces an empty catalogue. This has already taken the site down
   once; the reasoning is written at the top of
   `src/lib/booking/availability.ts`. Read it before touching that file.
7. **No fabricated data in structured data.** `src/app/(marketing)/page.tsx`
   emits schema.org JSON-LD and adds `aggregateRating` only when real approved
   reviews exist. Placeholder content must never reach it — invented review
   markup earns a Google manual action.
8. **`npm run audit:contrast` must pass at every phase gate.** It reads tokens
   from `globals.css` and fails on any same-element pairing below WCAG AA.
9. **`npx tsc --noEmit` and `npx next build` must pass at every phase gate.**
10. **Third-party API credentials are server-side only.** The Prokerala client
    ID and secret must never reach the browser bundle. All calls go through
    route handlers. Same rule that already applies to the Razorpay secret.
11. **Do not delete or restructure the database.** Schema changes, if any, go in
    a new numbered file in `database/`, and must `alter table … add column if
    not exists` **before** any policy that references the new column. Getting
    this order wrong dropped the public read policy and emptied the site once
    already — `database/21_repair_services_policy.sql` documents it.
12. **The free tools must not be added to `NOINDEX_PREFIXES`.** Those routes
    exist to be found. Add them to `sitemap.ts` instead.

### Phases

Work in this order. **Stop at each gate, run the checks, and report before
continuing.** Do not run phases in parallel.

---

**Phase 1 — Palette**

1. Replace the `@theme` block in `src/app/globals.css` with the token set in
   `docs/design-refactor.md` §4. Use those hex values as given.
2. **Keep 0px radius.** This is the correction that matters most — their cards
   are square with a 1px gold hairline and a second inset rule, not rounded.
   The existing sharp-corner discipline survives the palette change. §4 has the
   full shape table.
3. **Keep "no soft shadows".** The only shadow in the new system is a **hard
   offset block** in a darker orange under primary CTAs. No blur.
4. Add the `.notch-panel` clip-path utility from §9.5, with the
   `@supports not (clip-path: …)` square fallback.
5. Two accent weights are not interchangeable: `--color-saffron` (`#ee9a22`)
   is for **fills and icons only** — it measures ~2.1:1 on cream and fails as
   text. Any saffron *text* uses `--color-saffron-deep` (`#b5620a`). Their own
   site gets this wrong in its display headings; do not copy the fault.
6. Update the band classes. Note the comment above `.band-navy` about
   `background` shorthand versus `background-image` — that bug is documented
   there because it made body text invisible once. Preserve the structure.
7. Consider swapping Inter for Poppins (§4, Typography). Keep Cormorant
   Garamond for display.

**Gate:** `npm run audit:contrast` passes · `npx tsc --noEmit` · `npx next build`

---

**Phase 2 — UI primitives**

- `button.tsx` — **primary**: square, vertical saffron→amber gradient, hard
  offset shadow. **Secondary**: square, outlined, transparent fill (this is
  what their in-card "Book Now" / "Calculate for Free →" buttons are).
  **onDark**: must work against the terracotta band.
- `badge.tsx` — **not pills.** Small plain text positioned top-right of a card,
  no fill, no border.
- `card.tsx` — square, 1px `--color-hairline` border, second rule inset a few
  px. No shadow.
- `field.tsx` — underlined inputs, not boxed. Their forms use a bottom rule
  only, with the label above.

**Gate:** all three checks.

---

**Phase 3 — Placeholder infrastructure**

1. `src/components/common/Placeholder.tsx` — wraps fabricated content in a
   dashed outline with a corner ribbon reading
   **PLACEHOLDER — REPLACE BEFORE LAUNCH**. Visible in production too; that is
   the point.
2. `scripts/audit-placeholders.js` + `npm run audit:placeholders` — exits
   non-zero if any `<Placeholder>` remains. This gates launch, not the build.
3. It may wrap rendered UI. **It must never feed JSON-LD** (constraint 7).

**Gate:** all three checks, plus `npm run audit:placeholders` runs and reports.

---

**Phase 4 — Header and footer**

**Header** — single terracotta bar, wordmark centred, nav split left and right
of it, filled saffron LOGIN button at the far right. White nav text on
`--color-terracotta-lo`, not `--color-terracotta`, so it clears 4.5:1.

**Footer** — centred logo and tagline at the top, then four columns, on a
**terracotta vertical gradient** (`--color-footer-top` → `--color-footer-btm`).
Not maroon. Include the newsletter email capture: underlined white input with
an arrow submit. Wire it to the existing `leads` table or leave the form
non-functional and clearly marked — do not fake a subscription.

Keep all four legal links in the footer. Razorpay's activation check crawls for
them, and Google's OAuth review needs privacy and terms reachable from every
page.

**Gate:** all checks.

---

**Phase 5 — Conversion components** *(highest value in this refactor)*

1. `src/lib/content/questions.ts` — for each of the 4 services, a life area and
   **three questions in the visitor's own voice**. See §3.2 of the spec for the
   pattern. Claim nothing; ask.
2. `QuestionCards.tsx` — photo, gradient scrim, life area, three questions.
3. `IncludesList.tsx` — tick-marked list rendered from `services.highlights`,
   which is already a column. Stagger items ~40ms on reveal.
4. `IconStrip.tsx` — quick-access row under the hero.
5. `StatBand.tsx` — count-up on intersection. **Render the real final value in
   the HTML and animate from it**, so a JS failure shows the number rather than
   a zero. Wrap in `<Placeholder>` since no real figures exist yet.

**Gate:** all checks.

---

**Phase 6 — Homepage**

Re-order to §3.1 of the spec, minus the sections with no product behind them
(calculators, Panchang, courses, astrologer grid, app banner).

Rewrite the copy into the tone documented in §3.5 — second person, question
headings, short declaratives, outcome nouns. The mapping table there gives four
worked examples. **Do not import their superlatives** ("India's No.1", "Best
astrologer in India") or scarcity language.

Add the long-form SEO prose block below the fold — roughly 600–800 words in
`## question` sections. This is the single biggest SEO gap and the homepage
currently has almost no indexable body copy.

Keep `PurposeStatement.tsx` on the page. It exists to satisfy a Google OAuth
verification finding and must stay publicly readable without login. Restyle it;
do not remove it or move it off `/`.

**Gate:** all checks.

---

**Phase 7 — Service detail pages**

Re-order to §3.2. Include the FAQ accordion per service.

The duration and mode toggles from their pricing cards are subject to
constraint 5 and 1: durations and modes are database columns, and price is
recomputed server-side at order time. A toggle may switch between two real
service rows. It must never adjust a displayed price client-side.

**Gate:** all checks.

---

**Phase 8 — Legal pages**

Add the section index and numbered section eyebrows described in §3.3.
`LegalDocument.tsx` renders from structured data in `src/lib/content/legal.ts`
— derive the index from `doc.sections`. **Do not rewrite any legal text**, and
do not copy their policy content: theirs is about shipping gemstones
internationally. After any change to `legal.ts`, run `npm run legal:export` and
commit the regenerated markdown.

**Gate:** all checks.

---

**Phase 9 — Booking flow, login, dashboards**

Re-skin only. Do not restructure. The booking flow contains the payment path.

**Gate:** all checks, and manually confirm the booking flow still reaches
Razorpay Checkout with the correct amount.

---

**Phase 10 — Motion**

Apply §9 of the spec. Reuse what exists rather than adding a library:
`Reveal.tsx` (IntersectionObserver, disconnects after firing),
`ScrollWatermark.tsx` (native scroll-timeline with rAF fallback),
`PortraitFrame.tsx`, `FaqAccordion.tsx`, `Testimonials.tsx`.

Non-negotiable: `prefers-reduced-motion: reduce` disables everything · animate
`transform` and `opacity` only · marquees pause on hover and focus-within ·
nothing animates the LCP element above the fold.

**Gate:** all checks, plus verify with reduced-motion forced on.

---

**Phase 11 — Calculators that need no API**

Read §10 of the spec first. Build these four before touching any integration —
they are pure arithmetic, cost nothing per call, cannot rate-limit, and they
establish the tool-page pattern that phases 12–13 reuse.

`/calculators/numerology` · `/calculators/name-number` ·
`/calculators/lo-shu-grid` · `/calculators/flames`

`src/lib/astrology/numerology.ts` — pure functions, no network, unit-tested.
Digit reduction, Chaldean and Pythagorean letter values, Lo Shu grid placement.
Label Flames honestly as a game, not astrology.

Each route: inline form above the fold → loading state → result → contextual
CTA into the paid consultation, plus 200–400 words of real explanatory copy
beneath for indexing. Add all four to `sitemap.ts`. **Do not** add them to
`NOINDEX_PREFIXES`.

**Gate:** all checks, plus unit tests for the arithmetic.

---

**Phase 12 — Consent and lead capture**

Before any tool collects a birth date. Spec §10.5.

1. Consent checkbox on every tool form, linking the privacy policy. Model it on
   the booking flow's `acceptTerms: z.literal(true)` — the **server** rejects a
   submission without it. Not pre-ticked.
2. New section in `src/lib/content/legal.ts` covering what the tools collect,
   why, and retention. Then run `npm run legal:export` and commit the
   regenerated markdown.
3. Add a row to `docs/legal-compliance.md` §5.2.
4. Marketing opt-in stays **separate and default-off**. Using a calculator is
   consent to receive the result, not consent to be marketed to.
5. Write into the existing `leads` table. It already has RLS.
6. Make **phone optional** — their form requires it, which suppresses
   completion. Email is enough to follow up.

**Gate:** all checks. Confirm a submission without consent is rejected
server-side, not just disabled in the UI.

---

**Phase 13 — Prokerala integration**

Spec §10.2 and §10.3. Read both before writing code.

1. `src/lib/astrology/provider.ts` — a provider interface, mirroring
   `src/lib/payments/provider.ts`, so the vendor is swappable.
2. `src/lib/astrology/prokerala.ts` — OAuth2 client-credentials, token cached
   until expiry. **Server-side only.** Every call goes through a route handler
   under `/api/astrology/*`. A client-side fetch would put the client secret in
   the browser bundle.
3. `database/23_astrology_cache.sql` — Postgres cache table. **`alter table …
   add column if not exists` before any policy referencing a new column.**
4. **Caching is the architecture, not an optimisation.** The free tier is 5,000
   credits/month and a Panchang call costs 10. The Panchang widget is on the
   homepage — uncached, that is 500 homepage views before the quota is gone and
   the homepage starts erroring. Cache Panchang per `(date, city)` for 24 hours
   and birth charts per `(date, time, lat, lng)` indefinitely. Cache in
   Postgres, not memory: serverless instances do not share memory, so an
   in-process cache multiplies calls rather than reducing them.
5. Handle **429** explicitly with a real "busy, try again shortly" state. The
   limit is 5 req/min. Do not retry in a tight loop.
6. Every tool degrades gracefully. If the provider is down the page still
   renders, explains itself, and offers the booking CTA.

Then build: `/free-kundli`, `/kundli-matching`, `/panchang` and the homepage
Panchang widget, `/calculators/moon-sign`, `/calculators/lagna`,
`/calculators/nakshatra`, `/calculators/rahu-ketu`.

**Gate:** all checks. Report the credit cost of one full page load of the
homepage and of each tool, cold and warm.

---

### Reporting

After each phase, report: files changed, the three check results, and anything
you chose to do differently from the spec with the reason. If a constraint
blocks something the spec asks for, say so and stop — do not work around it.

### Out of scope

Do not build: horoscope pages (daily/weekly/monthly/yearly), transit pages,
planet pages, muhurat or festival pages, courses, an astrologer grid, an
app-download band, or a blog.

All of those need prose written and re-written indefinitely. Generating them in
bulk is what Google's scaled-content-abuse policy targets, and the penalty is
site-wide — it would take the booking pages down with it. The free tools in
phases 11–13 are in scope precisely because they are deterministic: the same
inputs give the same correct answer forever, with no editorial upkeep.

---
