# Legal & compliance

What the four legal documents are written against, what is genuinely covered,
and what still needs a lawyer.

> ⚠️ **Nothing here is legal advice.** These documents were drafted to be
> *accurate about how this system behaves* — what it collects, who processes it,
> how refunds actually work. Accuracy is necessary but not sufficient. Have an
> Indian legal professional review them before launch, particularly the DPDP
> provisions.

---

## Where the documents live

`src/lib/content/legal.ts` is the **single source of truth**. It is structured
data, not JSX, for one reason: the text has to exist both on the site and as
markdown, and maintaining two copies guarantees they diverge the first time a
clause changes. Two versions of a privacy policy that disagree is worse than
having one.

```
src/lib/content/legal.ts          ← edit here
        │
        ├── /legal/{terms,privacy,refunds,delivery}   rendered pages
        └── docs/legal/*.md                           npm run legal:export
```

`npm run legal:export` transpiles the module and reads the real data structures.
It does **not** pattern-match the file as text — an earlier version did and
broke immediately, because a regex cannot parse a language.

---

## The three obligations these satisfy

### 1. India's DPDP Act 2023 (Rules 2025)

Full substantive compliance lands **13 May 2027**, but the notice requirements
are already the right shape for a privacy policy. The Act requires a notice
stating what personal data is collected, the purpose of processing, how the Data
Principal exercises their rights, and how to complain to the Data Protection
Board of India.

| Requirement | Where it is met |
|---|---|
| Itemised data collected, each with its purpose | Privacy §"What we collect, and why" — a definition list, one purpose per category |
| Data Fiduciary identified | Privacy §"Who we are" |
| Rights: access, correction, erasure, nomination, grievance | Privacy §"Your rights" |
| How to withdraw consent | Privacy §"Your rights" — self-service in the dashboard, or via the Grievance Officer |
| Route to complain to the DPBI | Privacy §"Grievance Officer" |
| Named contact for data requests | Privacy §"Grievance Officer" |
| Children's data | Privacy §"Children" — 18+, guardian bookings addressed |
| Breach notification commitment | Privacy §"Security" |
| Clear, accessible language | Written in plain English throughout; no defined-term thicket |

**Genuinely notable:** the site collects **birth date, time and place**, which is
unusually identifying. The policy states it is optional, that a booking proceeds
without it, and that it is used solely to prepare the consultation. The booking
form already reflects this — "I am not sure of the exact birth time" is a
first-class answer, not a validation failure.

### 2. Razorpay merchant activation

Razorpay runs an **automated check** on the primary website during activation
and looks for a specific set of pages. All six now exist:

| Razorpay requirement | URL | Status |
|---|---|---|
| Terms and conditions | `/legal/terms` | ✅ |
| Privacy policy | `/legal/privacy` | ✅ |
| Cancellation and refunds | `/legal/refunds` | ✅ |
| Contact us | `/contact` | ✅ |
| Pricing details | `/services` | ✅ real prices from the database |
| Shipping/delivery policy | `/legal/delivery` | ✅ **added for this** |

`/legal/delivery` exists purely because of that automated check. This practice
ships nothing, so the page says so plainly and then documents how a consultation
is actually delivered — joining link by email, reminder at 24 hours, session at
the scheduled IST time. That is more useful to a client than a shipping policy
would have been, so it earns its place regardless.

All four are linked from the footer on **every page**, which is what the check
crawls for.

### 3. Google OAuth consent screen

Requires publicly reachable privacy and terms URLs before the app can be
published. Both exist and are linked site-wide. See `docs/google-auth-setup.md`.

### 4. IT Act intermediary rules

Require a **named grievance officer** with published contact details and a
stated response timeline. `GRIEVANCE_OFFICER` in `legal.ts` carries the name,
designation, email, phone, a 48-hour acknowledgement and a 30-day resolution
window, rendered into both the privacy policy and the terms.

---

## Where consent is actually captured

Publishing a policy is not the same as obtaining consent. The points where a
user actively agrees:

| Surface | Mechanism |
|---|---|
| Booking flow, before payment | Required checkbox linking the refund policy and terms. `acceptTerms: z.literal(true)` — the Zod schema **rejects** a submission without it, so it cannot be bypassed client-side. |
| Account signup | Terms and privacy linked beneath the submit button |
| Contact form | States the enquiry-only use of the details, and that they are never shared or sold |
| Marketing email | Separate opt-in on the profile, default **off**, unticked at signup |
| Cookies | No banner — the site sets only authentication and a short-lived booking-session cookie. There is nothing to consent to because there is no advertising or analytics tracking. |

That last one is a real design decision rather than an omission. No third-party
analytics were added, which is why no consent banner is needed.

---

## Placeholders that must be replaced before launch

| Item | Where | Note |
|---|---|---|
| `consult@komalkalra.com` | `src/lib/config.ts` → `BRAND.email` | Appears throughout all four documents and as the grievance contact. Must be monitored. |
| Grievance officer name | `legal.ts` → `GRIEVANCE_OFFICER.name` | Currently the founder. Under the IT Rules this must be a **named natural person**, not a role or shared inbox. |
| Business address | Not currently published | Razorpay activation generally expects a registered address on the site. Add to `/contact` if activation asks for it. |
| GST details | Not published; `TAX_BPS=0` | If the practice registers for GST, set `TAX_BPS=1800` and add the GSTIN to receipts. |

---

## What a lawyer should look at

Ordered by how much they matter:

1. **The DPDP provisions.** Retention periods, the erasure workflow, and whether
   birth data attracts any additional treatment. This is the highest-risk area
   and the newest law.
2. **Liability limitation.** The cap at "the amount paid for that consultation"
   is conventional but needs checking against Indian consumer protection law,
   which limits what can be excluded.
3. **The healing and counselling disclaimers.** Both sit near regulated
   territory. The terms state plainly that sessions are not a substitute for
   medical or psychological care and that a crisis should go to a professional —
   confirm that is worded strongly enough.
4. **Consumer protection / e-commerce rules.** Whether the practice qualifies as
   an "e-commerce entity" and what additional disclosure that would trigger.
5. **The refund policy against RBI norms** on refund timelines for online
   payments.

---

## Maintaining these

1. Edit `src/lib/content/legal.ts`.
2. Bump `LEGAL_LAST_UPDATED`.
3. Run `npm run legal:export`.
4. Commit both the source and the regenerated markdown.

The revision date shows on every page, so bumping it is not cosmetic — it is how
a client knows the terms they agreed to may have changed. For a material change,
tell account holders directly rather than relying on them noticing, which the
privacy policy commits to.

Sources consulted: [DPDP Act 2023 (MeitY)](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf) ·
[EY — DPDP Act and Rules 2025 compliance guide](https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023) ·
[Razorpay — Business website details](https://razorpay.com/docs/payments/dashboard/account-settings/business-website-details/) ·
[Razorpay — Account activation support](https://razorpay.com/docs/payments/account-activation-support/)
