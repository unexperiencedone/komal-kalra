# Antigravity refactor prompt

Paste everything between the rulers into Antigravity. It assumes the repo is
open and `docs/design-refactor.md` is present — the prompt refers to it rather
than repeating it, which keeps the agent reading the spec instead of a summary
of the spec.

**Before you paste:** the prompt's very first task is to sample the real palette
from the live site. That is deliberate. Every colour in the spec is derived, not
measured, and a refactor built on guessed values will look like a poor
imitation. If Antigravity cannot reach the site, do the sampling yourself with
the DevTools colour picker and paste the hex values into Phase 1 before running.

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
10. **Do not delete or restructure the database.** Schema changes, if any, go in
    a new numbered file in `database/`, and must `alter table … add column if
    not exists` **before** any policy that references the new column. Getting
    this order wrong dropped the public read policy and emptied the site once
    already — `database/21_repair_services_policy.sql` documents it.

### Phases

Work in this order. **Stop at each gate, run the checks, and report before
continuing.** Do not run phases in parallel.

---

**Phase 1 — Palette**

1. Open https://astroarunpandit.org/the-call-consultation/ and sample the real
   colours: page background, primary CTA fill (and its gradient stops), heading
   colour, body colour, footer background, badge fills, hairline/border colour.
   Report the hex values you measured.
2. Rewrite the `@theme` block in `src/app/globals.css` with those values,
   keeping the naming shape in `docs/design-refactor.md` §4. Keep the fonts
   (Cormorant Garamond + Inter).
3. Saffron is a hard accent to make legible. You will need **at least three
   weights** — a fill, a darker one for text on light grounds, a lighter one
   for text on dark grounds. Do not use one saffron everywhere.
4. Add radius and shadow scales; the old system's 0px-radius and no-shadow
   rules are retired.
5. Update the band classes. Note the comment above `.band-navy` about
   `background` shorthand versus `background-image` — that bug is documented
   there because it made body text invisible once. Preserve the structure.

**Gate:** `npm run audit:contrast` passes · `npx tsc --noEmit` · `npx next build`

---

**Phase 2 — UI primitives**

`button.tsx` (saffron gradient fills, rounded, working `onDark` variant against
the new dark ground), `badge.tsx` (pills), `card.tsx`, `field.tsx`.

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

Two-row sticky nav (utility row above, main row below, utility row collapses on
scroll). Four-column footer on the dark ground. Keep all four legal links in the
footer — Razorpay's activation check crawls for them and Google's OAuth review
needs privacy and terms reachable from every page.

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

### Reporting

After each phase, report: files changed, the three check results, and anything
you chose to do differently from the spec with the reason. If a constraint
blocks something the spec asks for, say so and stop — do not work around it.

### Out of scope

Do not build: free calculators, Panchang, horoscope pages, courses, an
astrologer grid, or a blog. Those are new products, not a refactor. §3.4 of the
spec explains which are worth doing later and why.

---
