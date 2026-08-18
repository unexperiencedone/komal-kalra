# Design refactor — adopting the Astro Arun Pandit visual language

Research, decisions and a build spec for moving this site from the "Silent
Luxury" system to the saffron/devotional theme of
[astroarunpandit.org](https://astroarunpandit.org/).

Paired with `docs/antigravity-refactor-prompt.md`, which is the prompt to hand
to the agent that does the work.

---

## 1. What was researched, and what could not be

**Pages read in full** (16 Aug 2026):

| Page | What it was read for |
|---|---|
| [Homepage](https://astroarunpandit.org/) | Section order, service card system, category tabs, footer architecture |
| [The Call Consultation](https://astroarunpandit.org/the-call-consultation/) | Service detail page structure — this is the template worth copying |
| [Refund Policy](https://astroarunpandit.org/refund-policy/) | Policy page presentation |

**What could not be captured, and why it matters.** Exact hex values were not
sampled. The Chrome extension was unreachable during this session, and their
logo SVG returned empty over plain HTTP, so **every colour in §4 is derived
from the visual family, not measured from their stylesheet.**

That distinction is load-bearing. Do not treat §4 as ground truth. The first
task in the refactor prompt is to open the live site and sample the real
values, because a palette that is *approximately* someone else's brand looks
like a bad photocopy rather than a deliberate choice.

---

## 2. The asymmetry, stated plainly

This matters more than any colour decision, so it goes first.

| | Astro Arun Pandit | Astrologer Komal Kalra |
|---|---|---|
| Business shape | Company, Noida + Kanpur offices, staff astrologers | Solo practitioner |
| Catalogue | Reports, pujas, courses, gemstone e-commerce, an app, free calculators | 4 consultation services |
| Proof | 51 yrs legacy, 1.2 lakh consultations, 21 awards, 2.4M followers, celebrity video testimonials | None of it yet |
| Price anchoring | ₹1,21,000 – ₹5,00,000 | ₹2,100 range |
| Page purpose | Funnel into a marketplace | Book one person's time |

Their design solves *their* problem: enormous catalogue, need to establish
authority fast, many entry points. Several of their strongest devices exist
purely to manage scale Komal does not have — the category filter tabs, the
astrologer grid, the mega-footer with 60 links.

So this refactor takes their **visual language and page grammar**, and drops
the parts that only make sense at their size. Where a section has no honest
content behind it, §5 says so.

---

## 3. What their pages actually do

### 3.1 Homepage section order

```
promo strip (seasonal campaign)
sticky nav (utility row above, main row below)
hero — campaign offer, single CTA, decorative chakra
icon quick-access strip (7 circular icons)
"Our Services" — category tabs + badged cards
free-tool lead magnet (inline Kundli form)
free calculators grid
Panchang widget
courses carousel
press/media marquee
consultation pitch band (4 icon cards)
astrologer grid (call/chat pricing)
podcast marquee
video horoscope carousel
stats counters
testimonials
long-form SEO prose (~800 words)
mega footer (6 link columns + contact + legal row)
```

Two things there are worth stealing outright and are easy to miss:

**The long-form SEO block.** Roughly 800 words of genuine prose below the fold,
structured as `## Why should you choose…` / `## Benefits of…` questions. It is
not decoration — it is a large part of why they rank. This site currently has
almost no indexable body copy on `/`.

**The icon quick-access strip.** Seven circular icons immediately under the
hero, each a direct route to a service. Cheap, and it gives a visitor who
scrolled past the hero somewhere to go before the services section loads.

### 3.2 Service detail page — the template to copy

`/the-call-consultation/` is the most transferable page on their site:

```
1  hero          outcome-led H1 + one-line subhead + CTA
2  stat strip    animated counters, icon + number + label
3  logo marquee  press / media logos
4  narrative     "This is not just a consultation" + portrait + CTA
5  differentiators   4 cards: icon, heading, 2-line body
6  PROBLEM CARDS 4 cards: photo, life area, THREE QUESTIONS
7  pricing       cards with Mode / Duration / Type toggles + includes list + price
8  premium tier  photo + "What You Will Get" checklist + details row + price
9  testimonials  video + quote carousel
10 FAQ           accordion, 5 questions
11 CTA           repeat
```

**Section 6 is the single best device on their site.** Each card names a life
area and then asks three questions in the visitor's own voice:

> **Career** — Why does success always feel slow or just out of reach?
> Should you keep going, switch paths, or try something new?
> What kind of work will truly fulfill you and bring stability?

No claims, no statistics, nothing to substantiate. It converts because the
visitor recognises themselves. It transfers to Komal's practice unchanged, and
it is the highest-value item in this whole document.

**Section 7's toggles** (30 Min / 1 Hour, Audio / Video) present duration and
mode as *choices* rather than fixed attributes. Komal's services have fixed
durations in the database, so this becomes a presentational pattern only — see
§5.4 for the constraint.

Note also: the CTA "Schedule a call ➜" appears **four times** on that page.
Current service pages have it twice.

### 3.3 Policy pages — genuinely better than ours

Their refund policy opens with a jump-link index, then numbers every section:

```
# Refund Policy

### Sections
- Non-Returnable Items/Services   → #section-1
- Return Process                  → #section-2
- Refunds                         → #section-3
  … 16 in total

#### SECTION 1
## NON – RETURNABLE ITEMS/SERVICES
```

The eyebrow + numbered heading + anchor index is a real usability improvement
over our current continuous-prose legal pages, and it costs nothing in honesty.
`LegalDocument.tsx` already renders from structured data in
`src/lib/content/legal.ts`, so adding an index means deriving it from
`doc.sections` — no content rewriting at all.

Their content is also a useful negative example: sections 7–13 are about
shipping gemstones and international customs, which is why our
`/legal/delivery` says plainly that nothing is shipped. Do not copy their
substance. Copy their navigation.

### 3.4 Route architecture — where their traffic actually comes from

Their `sitemap.xml` lists roughly **330 URLs**. The breakdown is the whole
marketing strategy in one number:

| Bucket | Approx. count | Purpose |
|---|---|---|
| Horoscopes — daily / weekly / monthly / yearly / love / career / health × 12 signs | ~120 | Recurring free traffic |
| Transits & planets — `/transit/venus-transit-in-gemini-2026-effects-remedies/` | ~55 | Long-tail seasonal search |
| Free calculators — kundli, matching, numerology, nakshatra, lucky colour, lo-shu | ~25 | Lead capture |
| Blogs — palmistry, doshas, festivals, "what is astrology" | ~50 | Top-of-funnel education |
| Muhurats, festivals, holiday calendars | ~20 | Seasonal spikes |
| Puja product pages | ~55 | Commerce |
| **Paid consultation / report pages** | **~15** | **Revenue** |
| Legal, about, contact | 5 | Trust |

**About 95% of their site exists to rank, not to sell.** Fifteen money pages
sit behind three hundred free ones.

Three mechanics are worth copying and one is not:

1. **Free tool as lead capture.** Their Kundli calculator asks for Name,
   **Phone**, **Email**, DOB, time and place *before* returning a result. It is
   a lead form wearing a tool's clothes, and it is the top-of-funnel engine.
2. **Question-shaped URLs and headings.** `/blogs/what-is-dasha-in-astrology/`,
   `/blogs/moon-sign-vs-sun-sign/`. These match how people actually search.
3. **Recurring content with a date in the slug** — `horoscope-2026`,
   `saturn-transit-in-2026`. Refreshed annually, ranks continuously.
4. **Campaign landing pages** — four separate URLs for the same Kundli product
   (`-campaign`, `-gab`, `premium-kundli-report`, `the-premium-…`). This is ad
   funnel hygiene at their spend level. **Do not copy it** — near-duplicate
   pages on a 15-page site is a thin-content signal, not an advantage.

**What this means for Komal.** She has no content engine at all: `/`,
`/services`, 4 service pages, `/about`, `/faq`, `/contact`, 4 legal pages. That
is 13 indexable URLs against their 330. No palette change will fix that, and it
is honestly the largest gap between the two sites — bigger than the visual one.

Recommended route additions, in order of effort against return:

| New route | Why |
|---|---|
| `/blog/[slug]` + 6–10 posts | The only realistic organic growth path. Topics she can write with authority: what a Kundli reading actually involves, how to find your birth time, what Mangal Dosha does and does not mean |
| `/free-kundli` | A genuine free tool that captures name/email/phone into `leads` — the table already exists |
| `/horoscope/[sign]` | 12 pages, refreshed monthly. High effort to maintain honestly; only do it if she will actually write them |
| `/services` category filter | Already have 4 services; tabs are marginal here |

Be honest about the trade: the blog and the free tool are real work, not a
refactor. They are listed here because "copy their marketing strategy" without
them is copying the paint and not the engine.

### 3.5 Tone of voice

Their copy has a consistent and reproducible register. Collected from the
homepage, `/about-us/` and `/the-call-consultation/`:

**What it does**

- **Second person, always.** "Why does success always feel slow *or just out of
  reach*?" Not "clients often feel…".
- **Headings are questions.** "Why People Wait Months to Speak to Him?" · "Too
  Many Thoughts, No Clear Answer?" · "Which Astrology App is Best?"
- **Short declaratives, no subordinate clauses.** "He does not just read charts.
  He reads what your soul wants to hear."
- **Anti-fear positioning, stated explicitly.** "True astrology is authentic, not
  superficial — a science meant to elevate, not exploit." · "No sugarcoating.
  You do not get vague predictions."
- **Outcome nouns, repeated:** clarity, direction, confidence, stability,
  peace. Rarely "insight", never "journey" in the abstract.
- **Vision / Mission stated in one sentence each**, as a labelled pair.
- **A pulled founder quote** in the founder's own first person.
- **Hinglish where the audience is Hindi-first** — nav reads "गोचर 2026" beside
  "Transit 2026". Not translated pages; a bilingual surface.

**What to leave behind**

- Superlatives that need substantiating: "India's No.1", "Best astrologer in
  India", "The Man Behind the Miracles".
- Scarcity theatre: "ONLY 10 SLOTS LEFT", "LIMITED SEATS".
- Outcome guarantees: "Remedies That Rewire Karma".

**Mapping the register onto Komal's current copy.** Hers is more literary and
third-person distant — "Clarity for the Curated Life", "Professional
astrological consultation and life coaching designed to provide precision,
discretion, and profound insight." That is a *different register*, not a worse
one, but it is not theirs. The equivalent in their voice:

| Current | In the AAP register |
|---|---|
| "Clarity for the Curated Life" | "One conversation can show you where you actually stand" |
| "Professional astrological consultation and life coaching designed to provide precision, discretion, and profound insight." | "Stuck on a decision? Not sure what the next year holds? Talk to Komal directly — in English, Hindi or Punjabi." |
| "A tailored approach to understanding your unique path" | "Choose the conversation that fits what you are dealing with" |
| "Begin — A single conversation is often enough" | "Still deciding? One call is usually all it takes" |

Note the shift: abstract nouns become verbs and questions, and the reader is
addressed directly. Her three languages are a real, checkable differentiator and
should be stated early — AAP does exactly this with "Available in Hindi and
English".

---

## 4. The saffron token set

⚠️ **Derived, not sampled.** Verify against the live site before committing —
see §1.

Replacing `@theme` in `src/app/globals.css`. The current Silent Luxury triad
(Cosmic Navy / Warm Ivory / Muted Gold) is retired.

```css
@theme {
  /* Ground */
  --color-deep-maroon:  #4a0e0e;   /* footer, inverted bands, headings on light */
  --color-ink-black:    #1a0f0a;   /* body copy on light grounds                */
  --color-cream:        #fff8ed;   /* the canvas — replaces warm-ivory          */
  --color-sand:         #f7ecd9;   /* card fill — replaces linen-grey           */

  /* Saffron, in three weights — same discipline as the three golds we had.
     One saffron cannot serve both a cream ground and a maroon one.           */
  --color-saffron:      #f28c1c;   /* fills, CTA gradients, decorative         */
  --color-saffron-deep: #a33e00;   /* accent TEXT on cream and sand            */
  --color-saffron-lift: #ffc46b;   /* accent TEXT and hairlines on maroon      */

  --color-marigold:     #ffd24a;   /* highlights, badge fills, rule accents    */
  --color-vermilion:    #c4341c;   /* urgency/offer badges only                */
}
```

**Contrast — this is not optional.** `npm run audit:contrast` reads tokens
directly from `globals.css` and fails the build on any same-element pairing
below AA. Saffron is a genuinely difficult accent: `#f28c1c` on cream is around
2.3:1, nowhere near the 4.5:1 needed for text. That is exactly why there are
three weights. Expect the audit to catch several pairs on the first pass — it
caught three real faults last time and every one was a visible bug.

### What changes beyond colour

| Silent Luxury rule | Saffron replacement |
|---|---|
| 0px radius everywhere | 12–16px on cards and buttons; pills for badges |
| No shadows — tonal layering only | Soft warm shadows return: `0 4px 20px rgba(74,14,14,.08)` |
| Gold is accent, never fill | Saffron **fills**. CTAs become saffron→marigold gradients |
| Cormorant Garamond display | Keep it. It reads as Indian-premium and is doing no harm |
| Inter body | Keep it |

Fonts stay. The pairing is not what makes the current site feel restrained —
the palette, the sharp corners and the absent shadows are.

---

## 5. Sections, and whether they have honest content

You chose to **include placeholder sections with visible markers**. That is
workable, but it needs a mechanism, because "we'll remember to remove it" is
how a placeholder ships.

### 5.1 The placeholder convention

Every fabricated value renders inside a wrapper that is impossible to miss:

```tsx
<Placeholder label="Awaiting real figures">
  <StatBand stats={PLACEHOLDER_STATS} />
</Placeholder>
```

`Placeholder` draws a dashed vermilion outline and a corner ribbon reading
**PLACEHOLDER — REPLACE BEFORE LAUNCH**, in both development and production.
Making it visible in production is the point: an ugly ribbon on a live site
gets fixed, a subtle dev-only warning does not.

Alongside it, `npm run audit:placeholders` greps for the component and exits
non-zero if any remain. Wire it into the pre-deploy check so launch is blocked
until they are gone.

### 5.2 Section-by-section

| Section | Honest content today? | Decision |
|---|---|---|
| Hero | Yes | Build |
| Icon quick-access strip | Yes — 4 services + contact | Build |
| Services grid with badges | Partly | Build. Badges only where a fact exists: duration, mode, "Written summary included". **No "India's No.1", no "7L+ Sold"** |
| Problem/question cards | Yes — needs writing, claims nothing | **Build. Highest priority** |
| Differentiator cards | Yes — languages, written summary, free cancellation | Build |
| Includes checklist | Yes — `services.highlights` is already in the database | Build |
| Stat counters | **No** | Build wrapped in `<Placeholder>` |
| Press/media marquee | **No** | Build wrapped in `<Placeholder>` |
| Testimonials | Only if approved rows exist | Existing behaviour is right: render nothing when empty. Do not placeholder this one — see §5.3 |
| Long-form SEO prose | Yes — needs writing | Build |
| FAQ per service | Yes — `/faq` content exists | Build |
| Mega footer | Yes, at smaller scale | Build, 4 columns not 6 |
| Free calculators, Panchang, courses, astrologer grid, app banner | **No such products** | Do not build |

### 5.3 The one place placeholders are genuinely dangerous

`src/app/(marketing)/page.tsx` emits `schema.org` JSON-LD, and it currently
adds `aggregateRating` **only when real approved reviews exist**:

```ts
...(reviews.length > 0 && { aggregateRating: { … } })
```

Placeholder review data must never reach that object. Invented review markup is
a Google manual action — the site drops out of search results, and the recovery
process takes weeks. The visible ribbon does not protect you here because
structured data is not visible at all.

**Rule: `<Placeholder>` may wrap rendered UI. It must never feed JSON-LD.**

---

## 6. What must survive the refactor untouched

This is a working payment system, not a template. The following are not
cosmetic and an agent refactoring "the whole website" will break them if not
told:

1. **Payments are real.** Razorpay orders are created server-side, amounts are
   recomputed from the database, and success is established by HMAC signature
   verification plus a webhook — never by client state. Nothing in
   `src/lib/payments/` or `src/app/api/payments/` is a styling concern.
2. **16 RLS policies key on `auth.uid()`.** Auth stays Supabase. Do not
   introduce another session mechanism.
3. **Money is integer paise.** Never a rupee float.
4. **Server-side role routing.** One `/login`. Roles are read from the profile
   on the server. Never gate admin UI on a client-side check.
5. **`internal` and `archived_at` filtering happens in JavaScript, not in
   PostgREST queries.** A `.eq()` on a column the database may not have yet
   returns 400 and silently empties the catalogue. This has already happened
   once; the reasoning is in `src/lib/booking/availability.ts`.
6. **No fabricated reviews or statistics in structured data.** See §5.3.
7. **`npm run audit:contrast` must pass.** It is the only automated check that
   the new palette is legible.

---

## 7. File map

| File | Change |
|---|---|
| `src/app/globals.css` | Replace `@theme` tokens; add radius and shadow scales; update band classes |
| `src/components/ui/button.tsx` | Saffron gradient fills, rounded, `onDark` variant against maroon |
| `src/components/ui/badge.tsx` | Pill shape, saffron/marigold tones |
| `src/components/ui/card.tsx` | Rounded, soft shadow |
| `src/components/marketing/ServiceCard.tsx` | Badge slot, rounded media, gradient CTA |
| `src/components/marketing/SiteHeader.tsx` | Two-row nav: utility row + main row |
| `src/components/marketing/SiteFooter.tsx` | 4-column mega footer, maroon ground |
| `src/components/marketing/LegalDocument.tsx` | Section index + numbered eyebrows |
| `src/components/marketing/QuestionCards.tsx` | **New** — the problem cards, §3.2 |
| `src/components/marketing/IncludesList.tsx` | **New** — checkmark list from `highlights` |
| `src/components/marketing/IconStrip.tsx` | **New** — quick-access row |
| `src/components/marketing/StatBand.tsx` | **New** — counters, placeholder-wrapped |
| `src/components/common/Placeholder.tsx` | **New** — §5.1 |
| `src/app/(marketing)/page.tsx` | Re-order to §3.1; add SEO prose block |
| `src/app/(marketing)/services/[slug]/page.tsx` | Re-order to §3.2 |
| `src/lib/content/questions.ts` | **New** — question card copy per service |
| `scripts/audit-placeholders.js` | **New** — §5.1 |

Untouched: everything under `src/lib/payments/`, `src/lib/supabase/`,
`src/app/api/`, and `database/`.

---

## 8. Suggested order

Palette first, because every later decision depends on it, and the contrast
audit will reject work built on unverified colours.

1. Sample the real palette → rewrite tokens → **audit:contrast passes**
2. UI primitives — button, badge, card, input
3. Header and footer
4. `Placeholder` + `audit:placeholders`
5. Question cards and includes list (the conversion work)
6. Homepage re-order + SEO prose
7. Service detail re-order
8. Legal page section index
9. Booking flow and dashboards re-skinned to match
10. Full verification: typecheck, build, contrast, placeholders

Steps 1–8 are marketing surface. Step 9 is the one most likely to break
something, because the booking flow contains the payment path — re-skin it,
do not restructure it.

Motion is not a separate step. Each component gets its behaviour when it is
built — see §9.

---

## 9. Motion and interaction inventory

Every animated behaviour observed on their site, top to bottom, with what it
takes to build. Several are inferred from the server-rendered markup rather
than watched running — where that is the case it says so, because the evidence
is different in kind.

### 9.1 Global

| Behaviour | Evidence | Implementation |
|---|---|---|
| **Sticky nav, two rows** | Utility row (Reports / Consultation / Horoscopes / Free Calculator) sits above the main row | `position: sticky`; collapse the utility row and shrink the wordmark past ~80px scroll |
| **Scroll-state nav** | Glass tint over content | Already have `.glass-nav`. Add a scrolled class toggled by an `IntersectionObserver` sentinel — not a scroll listener |
| **Mobile drawer** | Separate mobile logo + long nav list in markup | Already built in `SiteHeader.tsx`. Keep the body-scroll lock |
| **Section reveal on scroll** | Consistent across their pages | **Already built** — `Reveal.tsx`, IntersectionObserver, fires once then disconnects. Reuse it everywhere rather than adding a library |
| **Rotating chakra behind hero** | `circle.3f8ab5ff.webp` positioned in the hero | **Already built** — `ScrollWatermark.tsx` does scroll-scrubbed rotation with a native scroll-timeline and an rAF fallback. Retarget it at the hero |

### 9.2 Counters and marquees

| Behaviour | Evidence | Implementation |
|---|---|---|
| **Count-up stats** | Static HTML renders `0+`, `0M+`, `0Lakh+` — the real numbers only exist after JS runs | `IntersectionObserver` → `requestAnimationFrame` ease-out over ~1.2s. **Render the final value in the HTML** and animate from it, so a JS failure shows the number rather than a zero. Theirs currently shows "0+" to any crawler, which is a real bug worth not copying |
| **Press-logo marquee** | `img1…img7` repeated six times in source | CSS `@keyframes` translating `-50%` on a duplicated track. `aria-hidden` on the clone, `will-change: transform` |
| **Podcast marquee** | Same pattern, ~35 duplicated images | Same component, different feed |
| **Course carousel** | Three courses emitted twice | Same marquee if it loops, arrows + snap if it paginates. **Not observed running** |

Marquees must pause on hover and on focus-within, or a keyboard user can never
reach a link inside one.

### 9.3 Service and pricing interaction — the important ones

| Behaviour | Evidence | Implementation |
|---|---|---|
| **Category filter tabs** | `All / Consultations / Reports / Kundli / Online Puja` above the service grid | Client state; filter the array. Animate with `view-transition-name` per card, or a CSS grid + opacity/translate transition. Keep it as real `role="tab"` markup, not styled divs |
| **Duration toggle** (30 Min / 1 Hour) | Inside each pricing card | **This one has a constraint.** Komal's durations are fixed per service row in the database, and price is recomputed server-side at order time. So the toggle may only switch between *two real service rows* — never adjust a displayed price client-side. A toggle that changes a number the server will not honour is the exact class of bug the payment design forbids |
| **Mode toggle** (Audio / Video) | Same card | Same rule — `services.mode` is a column. Present it, do not compute from it |
| **Price transition** | Number changes with the toggle | Animate only after the new service row's real price is in hand |
| **Includes checklist** | Static list with tick icons | Stagger each item ~40ms on reveal |

### 9.4 Content components

| Behaviour | Evidence | Implementation |
|---|---|---|
| **FAQ accordion** | 5 Q&A on the consultation page | **Already built** — `FaqAccordion.tsx`, plus/minus pattern. Animate with `grid-template-rows: 0fr → 1fr`, which transitions smoothly without measuring height |
| **Testimonial carousel** | Quotes cycle, avatar row switches the active one | **Already built** — `Testimonials.tsx`. Add avatar-click selection |
| **Video tab switcher** | `Yearly Horoscope 2026 / Learn Astrology / Identifying Houses / All Planetary Transits` above a video row | Tabs + horizontal snap-scroll row |
| **Panchang chart** | Markup contains `Loading chart...` | Deferred client component. **Not applicable** — no Panchang product |
| **Problem cards** | Photo with a `Shade.png` overlay layered on top | Image + gradient scrim; lift and brighten the scrim on hover. `@media (hover: hover)` only — a permanent hover state on touch is worse than none |
| **Hero portrait "animated shade"** | `arunji-img` carries `title="adding shade"` | A moving gradient over the portrait. **Already have** `PortraitFrame.tsx` doing a settle-on-first-view; extend rather than replace |

### 9.5 The calculator pattern

Their free tools are the funnel entry point, and the interaction is worth
describing precisely because the *sequence* is the design:

```
inline form (Name, Phone, Email, DOB, TOB, Place, Gender)
        ↓ submit
   loading state
        ↓
partial result revealed  →  gated CTA to the paid product
```

The form sits **inline in the page**, not behind a click, and it asks for phone
and email before returning anything. If `/free-kundli` gets built, the
mechanics that matter are: a real loading state, a result that arrives
progressively rather than all at once, and a write into the existing `leads`
table.

One caution, since this is the funnel's front door: a form collecting birth
date, time, place, phone and email is a substantial personal-data collection
under the DPDP notice requirements. `docs/legal-compliance.md` §5.2 covers where
consent is captured — a new lead-capture form needs adding to that table, and
the privacy policy needs to mention it. Do not ship the tool without it.

### 9.6 Motion rules that are not negotiable

1. **`prefers-reduced-motion: reduce` must disable all of it** — marquees,
   counters (show the final value), parallax, reveals. This is a WCAG 2.2
   requirement, not a preference, and vestibular-triggering motion is a real
   accessibility harm.
2. **No layout thrash.** Animate `transform` and `opacity` only. Anything
   animating `height`, `top` or `width` on scroll will drop frames on the
   mid-range Android phones most of this audience uses.
3. **One motion at a time per element.** The existing system's rule; it is what
   keeps the site from feeling cheap as the palette gets louder.
4. **Observers disconnect after firing.** `Reveal.tsx` already does this. A
   page with forty live IntersectionObservers scrolls badly.
5. **Nothing animates on first paint above the fold.** The hero headline should
   be readable at LCP, not fading in — fading in the largest text element is a
   direct Core Web Vitals cost.

Sources: [astroarunpandit.org](https://astroarunpandit.org/) ·
[Call consultation page](https://astroarunpandit.org/the-call-consultation/) ·
[Refund policy](https://astroarunpandit.org/refund-policy/)
