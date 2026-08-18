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

**Screenshots supplied** covering the hero, the service grid with category
tabs, the Kundli lead form, the free-calculator grid, the Panchang widget, the
app band and the podcast band. §4 is read from those.

**Accuracy caveat, stated once.** Colours in §4 are eyedropped from PNG
screenshots, not read from the stylesheet — the Chrome extension was
unreachable and their logo SVG returned empty over HTTP. Expect each value to
be within a point or two of the real one. That is close enough to build
against, but if a token looks subtly off in the browser, trust the browser and
correct the token rather than assuming the screenshot was right.

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
sticky nav — single terracotta row, centred wordmark, filled LOGIN at far right
hero — terracotta band: eyebrow pill, serif headline, subhead, TWO CTAs
       (filled primary + outlined secondary), portrait right on a line-art
       zodiac wheel, carousel dots beneath — the hero is a slideshow
icon quick-access strip — 6 square cream cards, circular outlined icons
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

**Decision: no free products in this refactor.** No calculators, no free
Kundli tool, no Panchang, no horoscope pages. Those are new products with real
ongoing cost — a Kundli calculator needs an ephemeris and a maintained
dataset, horoscope pages need writing twelve times a month forever, and a lead
form collecting birth date, time, place, phone and email is a substantial DPDP
data-collection that would need its own consent notice and privacy-policy
entry. Building them badly is worse than not building them.

The route count stays as it is. That is a deliberate trade, and worth naming
plainly: this refactor changes how the site *looks and reads*, not how much
traffic it can reach. If organic growth becomes the goal later, a `/blog` with
posts Komal can write with real authority — what a chart reading actually
involves, how to find an unknown birth time, what Mangal Dosha does and does
not mean — is the cheapest honest starting point. It is out of scope here.

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

Replacing `@theme` in `src/app/globals.css`. The current Silent Luxury triad
(Cosmic Navy / Warm Ivory / Muted Gold) is retired.

```css
@theme {
  /* --- Grounds ---------------------------------------------------------- */
  --color-terracotta:   #ab6318;  /* nav + hero band — the signature colour   */
  --color-terracotta-lo: #9a5814; /* same band where WHITE TEXT sits on it    */
  --color-amber-band:   #c67f1c;  /* the brighter band (Kundli/Panchang)      */
  --color-deep-maroon:  #6e2b13;  /* the app-download band only               */
  /* Footer is NOT maroon — it is a terracotta gradient, top to bottom:       */
  --color-footer-top:   #a35b13;
  --color-footer-btm:   #bd7418;
  --color-cream:        #fff7ec;  /* the page canvas                          */
  --color-card-cream:   #fcebd1;  /* card fill — peachier than the canvas     */

  /* --- Saffron in three weights ------------------------------------------
     One saffron cannot serve a cream ground and a maroon one. This is the
     same discipline the three golds had, for the same reason.               */
  --color-saffron:      #ee9a22;  /* FILLS, gradients, icons — not text       */
  --color-saffron-deep: #b5620a;  /* accent TEXT on cream (4.9:1)             */
  --color-saffron-lift: #ffc04a;  /* accent TEXT + hairlines on maroon        */

  /* --- Text -------------------------------------------------------------- */
  --color-cocoa:        #6e3a11;  /* section headings on cream — 8.4:1        */
  --color-card-title:   #8c4a12;  /* card headings on card-cream — 5.5:1      */
  --color-body-warm:    #3d3226;  /* body copy on cream — 12.6:1              */

  /* --- Lines and status --------------------------------------------------- */
  --color-hairline:     #e9b96a;  /* the 1px card border, everywhere          */
  --color-panchang-navy: #1f2b5e; /* the one cool colour on the whole site    */
  --color-success:      #17753a;  /* "Auspicious (Shubh)" green               */
  --color-whatsapp:     #25d366;  /* the float button — brand-locked          */
}
```

**Two real contrast faults on their site. Do not inherit them.**

1. **`#ee9a22` on cream is ~2.1:1.** They use it for the emphasised word in
   display headings — "Free **Calculators**", "Make Them **Remember** You". That
   fails AA even at large-text's relaxed 3:1. Use `--color-saffron-deep`
   (`#b5620a`, ~4.9:1) for any saffron *text*; keep `#ee9a22` for fills and
   icons where the 3:1 non-text threshold applies.
2. **White on `#ab6318` is ~4.4:1** — just under the 4.5:1 body threshold. Fine
   for the 18px+ nav, not fine for smaller text. `--color-terracotta-lo`
   (`#9a5814`, ~5.2:1) exists for wherever small white text sits on the band.

`npm run audit:contrast` reads these tokens from `globals.css` and will catch
both. It found three real faults on the last palette change and every one was a
visible bug.

### Shape language — I had this wrong before the screenshots

The initial spec assumed a saffron theme meant rounded corners and soft
shadows. **It does not.** Their cards are square, and the current 0px-radius
discipline largely survives:

| Element | What the screenshots show |
|---|---|
| Service cards, calculator cards | **Square corners.** 1px `--color-hairline` border, with a second inset border a few px in — a double-rule frame |
| Buttons *inside* cards ("Book Now", "Calculate for Free →") | Square, outlined, transparent fill — not filled buttons |
| Primary CTAs ("Review my Soul Purpose", "Get My Kundli", "Download app") | Square, saffron→amber vertical gradient, with a **hard offset shadow** in a darker orange. Not a soft blur — a solid displaced block |
| Feature cards (Kundli form, Panchang) | Square, but with **notched corner brackets** — chamfered `⟩ ⟨` cuts at the vertical mid-edges |
| Badges ("1-on-1", "FREE", "India's No.1") | No pill, no fill. Small text, top-right corner of the card |
| Icon medallions | Circles — outlined, not filled |

So: **keep 0px radius**, keep the hairline discipline, add hard offset shadows
on primary CTAs only, and add the corner-notch treatment as a `clip-path`
utility for feature panels. The existing "no soft shadows" rule stays true.

### Typography

| | Their site | Ours | Action |
|---|---|---|---|
| Display | High-contrast transitional serif | Cormorant Garamond | **Keep.** Very close family |
| Body | Geometric sans, single-storey `g`, wide apertures — reads as Poppins or similar | Inter | **Consider Poppins.** Inter is a neo-grotesque and noticeably tighter; Poppins is the closer match and is the more common choice on Indian consumer sites |

Two-tone headings are a signature and cost nothing: dark `--color-cocoa` for
the sentence, `--color-saffron-deep` for the emphasised word.

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
| Free calculators, free Kundli tool, Panchang, horoscopes, courses, astrologer grid, app banner | **No such products, and out of scope by decision** | Do not build — §3.4 |
| Newsletter capture in the footer | Yes — `leads` table exists | Build, wired to `leads`. Do not fake a subscription |

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
| `src/components/marketing/SiteFooter.tsx` | Centred logo, 4 columns, terracotta **gradient** ground, newsletter input |
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
| **Sticky nav, single row, centred wordmark** | Nav splits left (Reports / Consultation / Horoscopes / Free Calculator, each with a dropdown caret) and right (Poojan / Courses / About / Contact / LOGIN) around a centred logo | `position: sticky`. Three-column grid, not flex-between — the wordmark must stay optically centred regardless of link count. Dropdowns open on hover **and** on focus, or keyboard users cannot reach them |
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

### 9.5 The framed-panel treatment

**Not building the calculators** (see §3.4) — but the *frame* around their
Kundli and Panchang panels is the most distinctive shape on the site and is
worth lifting for panels that do have content: the pricing block, the contact
form, the booking summary.

It is a square card with **chamfered notches at the vertical mid-edges** —
`⟩` on the left, `⟨` on the right — sitting on a saturated amber band, with a
1px gold inner rule inset a few pixels from the border.

```css
.notch-panel {
  clip-path: polygon(
    0 0, 100% 0, 100% 42%, calc(100% - 18px) 50%, 100% 58%,
    100% 100%, 0 100%, 0 58%, 18px 50%, 0 42%
  );
}
```

`clip-path` cuts the border off with the shape, so the gold rule has to be an
inset child element rather than a `border` on the clipped box. Add
`@supports not (clip-path: polygon(0 0))` falling back to a plain square — the
panel must not lose its background if the clip is unsupported.

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
