# Google Sign-In — setup and branding

Two parts: getting it working (15 minutes), and making Google's consent screen
say **Astrologer Komal Kalra** instead of a random project reference.

---

## Why this uses Supabase Auth, not NextAuth

If you were expecting NextAuth, here is the reason it is not used.

Every row-level security policy in this database keys on `auth.uid()`:

```sql
create policy "appointments_select_own" on public.appointments
  for select using ((select auth.uid()) = user_id);
```

`auth.uid()` reads the **Supabase JWT**. A NextAuth session is a different
token, so `auth.uid()` would return `null` for anyone who signed in with Google
— and every "clients see only their own appointments / payments / notifications"
policy would stop protecting anything. There are **16 such policies** across
seven tables.

You would also end up with two user tables and two session lifecycles to keep
in sync, and `handle_new_user()` would never fire, so Google users would have no
`profiles` row at all — no role, no booking history, no payments.

Supabase's own Google provider puts the Google user in `auth.users` exactly like
a password user. The trigger fires, the profile is created with `role = 'client'`,
and every existing policy keeps working untouched.

---

## Part 1 — Get it working

### 1. Create the Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project
   (or select an existing one).
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill in the branding fields — see Part 2, this is the important bit.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: anything; this is internal only.

### 2. The two URI fields — exact values

This is the step people get wrong, because the two fields do different jobs and
neither of them wants your website's URL.

| Field in Google Console | What to enter |
|---|---|
| **Authorised JavaScript origins** | **Leave empty.** If the console refuses to save blank, enter `https://<project-ref>.supabase.co` |
| **Authorised redirect URIs** | `https://<project-ref>.supabase.co/auth/v1/callback` — this one entry, nothing else |

Find `<project-ref>` in Supabase → Project Settings → General. For this project
it is `jjuyybxikomkpmtvzlkl`, so:

```
Authorised redirect URIs
https://jjuyybxikomkpmtvzlkl.supabase.co/auth/v1/callback
```

#### Why JavaScript origins is empty

That field exists for flows where the **browser** talks to Google directly —
Google One Tap, or the `gapi` JS client. This app uses the server-side redirect
flow: `signInWithOAuth` returns a URL and the server issues a redirect. No Google
JavaScript ever loads in the browser, so there is no origin to authorise.

#### Why localhost is NOT in the redirect URIs

Even in local development, the round-trip is:

```
your browser  →  Google  →  https://<ref>.supabase.co/auth/v1/callback  →  localhost:3000/auth/callback
                                    ▲                                              ▲
                            Google redirects HERE                    Supabase redirects here afterwards
                            (this is what Google needs)              (Google never sees this URL)
```

Google only ever redirects to Supabase. Supabase then forwards to whichever of
your app's URLs made the request. So the single Supabase entry covers
development and production both, and adding `http://localhost:3000` to Google
achieves nothing.

Localhost belongs in **Supabase → Authentication → URL Configuration →
Redirect URLs**, which is step 4.

#### Common errors and what they mean

| Error | Cause |
|---|---|
| `redirect_uri_mismatch` | The redirect URI in Google does not match `https://<ref>.supabase.co/auth/v1/callback` exactly — check for a typo in the ref, a trailing slash, or `http` instead of `https` |
| Signs in, then lands on a Supabase error page | The app URL is missing from Supabase's **Redirect URLs** allow-list (step 4) |
| Works in production, fails locally | `http://localhost:3000/auth/callback` missing from that same Supabase allow-list |
| Redirected to localhost in production | `NEXT_PUBLIC_SITE_URL` still set to localhost in the production environment |

### 3. Paste the credentials into Supabase

Supabase Dashboard → **Authentication → Providers → Google**:

- Enable
- Client ID and Client Secret from step 1
- Save

### 4. Set the redirect allow-list

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:** add both
  ```
  https://your-domain.com/auth/callback
  http://localhost:3000/auth/callback
  ```

Without the localhost entry, Google sign-in works in production and fails
silently in development, which is a confusing hour to lose.

### 5. Check `NEXT_PUBLIC_SITE_URL`

`signInWithGoogle` builds the callback URL from this. If it is wrong in
production, users get bounced to localhost after authenticating.

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

That is it — no new environment variables, no new dependencies.

---

## Part 2 — Make the consent screen say your name

By default Google shows something like:

> Sign in to continue to **abcdefghijklmnop.supabase.co**

That reference is your Supabase project, and it looks like a phishing attempt to
anyone paying attention. There are two levers, and they fix different halves of
the screen.

### Lever 1 — App name and logo (free, do this first)

**APIs & Services → OAuth consent screen → Branding**

| Field | Set it to |
|---|---|
| App name | `Astrologer Komal Kalra` — this is the large text on the consent screen |
| User support email | A real monitored address |
| App logo | 120×120 square PNG. Shown beside the app name. |
| Application home page | `https://your-domain.com` |
| Privacy policy link | `https://your-domain.com/legal/privacy` |
| Terms of service link | `https://your-domain.com/legal/terms` |
| Authorised domains | `your-domain.com` |
| Developer contact | A real monitored address |

Both legal pages already exist in this project, which is fortunate — Google
requires them, and it also means the site does not need a rush job to satisfy
Razorpay's own activation requirements.

### Lever 2 — Publish the app (free, and required)

While the app is in **Testing**, only accounts you have explicitly added as test
users can sign in, and the branding does not render properly.

**OAuth consent screen → Publish app.**

Because this app only requests `email`, `profile` and `openid` — all
non-sensitive scopes — publishing is normally **instant** and needs no Google
review. You may still see an "unverified app" interstitial until domain
ownership is confirmed.

### Verify your domain (removes the "unverified" warning)

**Google Search Console** is the quickest route: add `your-domain.com` as a
property and verify by DNS TXT record. Once verified, add it under *Authorised
domains* on the consent screen.

### The `supabase.co` line — what actually removes it

Even with perfect branding, Google shows the **redirect host** on the consent
screen, and with a standard Supabase project that host is
`<project-ref>.supabase.co`.

The only way to change it is a **Supabase custom domain** (a paid add-on), which
moves the auth endpoint to something like `auth.your-domain.com`. Supabase's own
documentation recommends this specifically for OAuth, because it makes phishing
attempts easier for users to spot.

**My honest read on whether to pay for it:**

- Do Lever 1 and Lever 2 first. They cost nothing and fix the *prominent* text —
  users see "Astrologer Komal Kalra" with the logo as the headline.
- The `supabase.co` line is smaller secondary text. For a practice taking a few
  bookings a day it is unlikely to move the needle.
- Revisit it if Google sign-in becomes the main route to paid bookings and you
  see drop-off at the consent screen. The admin funnel numbers will show it.

---

## Part 3 — Clearing a failed verification

The first submission came back with three findings. Two are fixed in this
repository; one cannot be, and needs you to buy a domain. Deal with them in the
order below, because resubmitting before the domain is sorted just burns another
review cycle.

### Finding 1 — "The website of your homepage URL is not registered to you"

> `https://komal-kalra.vercel.app/`

**This is the blocker, and there is no code fix for it.**

`vercel.app` is a shared domain owned by Vercel. Google requires the homepage to
sit on a domain **you** own and have verified in Search Console, and the
authorized-domains field wants the registrable domain — which here is
`vercel.app`, not `komal-kalra.vercel.app`. You cannot prove ownership of a
domain that belongs to somebody else, so no amount of meta-tag verification will
satisfy this. The same rejection hits `*.web.app`, `*.netlify.app`,
`*.github.io` and every other free hosting subdomain.

Google's own guidance is to move to a domain you control, and Vercel supports
that on the free tier.

**What to do**

1. **Register a domain.** `komalkalra.com` is the obvious one — the codebase
   already assumes it, since `BRAND.email` is `consult@komalkalra.com`. Roughly
   ₹900–1,200 a year.
2. **Add it in Vercel** → Project → Settings → Domains. Point the registrar's
   nameservers or add the A/CNAME records Vercel shows you. Certificates are
   automatic.
3. **Verify it in Google Search Console** as a *Domain* property (DNS TXT
   record), not just a URL-prefix property. The DNS method is what Google Cloud
   reads when it checks authorized domains.
4. **Update the OAuth consent screen** → Branding:
   - Application home page → `https://komalkalra.com`
   - Privacy policy → `https://komalkalra.com/legal/privacy`
   - Terms of service → `https://komalkalra.com/legal/terms`
   - Authorised domains → `komalkalra.com`
5. **Update the app's own configuration** — this is easy to forget and breaks
   sign-in silently:
   - `NEXT_PUBLIC_SITE_URL=https://komalkalra.com` in Vercel, then
     **redeploy** (`NEXT_PUBLIC_` values are baked in at build time, so
     changing the variable alone does nothing).
   - Supabase → Authentication → URL Configuration → **Site URL** and add
     `https://komalkalra.com/auth/callback` to **Redirect URLs**.
   - Razorpay webhook URL, if it still points at the Vercel address.
   - The Google client's **Authorised redirect URIs** stay unchanged — they
     point at Supabase, not at your site. See Part 1.
6. Keep the old `komal-kalra.vercel.app` URL working, but do **not** list it as
   the homepage.

> Google also requires the homepage URL to be **static** — it must not redirect
> to another URL or domain. So set `komalkalra.com` (or `www.`, but pick one) as
> the primary domain in Vercel and give Google whichever one serves a 200
> directly, not the one that 308s across.

### Finding 2 — "Your homepage does not explain the purpose of your app"

**Fixed in this repository.** `src/components/marketing/PurposeStatement.tsx`
renders an *About this service* section on the homepage covering what Google
asks for:

| Google's requirement | How it is met |
|---|---|
| Describes the app's functionality | Opens by naming the app and stating that it is the booking service for one-to-one consultations |
| Explains why Google user data is requested | A dedicated block: name, email address and profile picture, and what each is used for |
| States what is *not* accessed | Explicitly rules out Gmail, Drive, Contacts, Calendar and Photos, and posting on the user's behalf |
| Links terms and privacy policy | Both linked inline, in addition to the footer |
| Readable without signing in | Server-rendered on `/`, no auth check anywhere in the path |
| Homepage is not just a login page | It never was — services, pricing, about and FAQ are all public |

The important constraint on that component: **if a scope is ever added to
`signInWithOAuth`, the disclosure has to change in the same commit.** An
inaccurate scope disclosure is itself a rejection reason, and a stale one is
worse than none. There is a note to that effect in the file.

### Finding 3 — "The app name does not match the app name on your homepage"

**Fixed in this repository.** The cause was two names for one business:
`BRAND.name` was `Komal Kalra` and drove the header wordmark, while
`BRAND.fullName` was `Astrologer Komal Kalra` and drove `<title>`,
`og:site_name` and the schema.org `Person`. A reviewer comparing one string
against a page showing two will fail it.

Both keys are now `Astrologer Komal Kalra`, so the wordmark, the page title, the
social metadata and the structured data all agree. The wordmark drops to 18px
below the `sm` breakpoint, because the longer string overflowed a 320px bar.

**Set the consent screen's App name to exactly `Astrologer Komal Kalra`** —
character for character, no extra punctuation. If you ever change the business
name, change `BRAND` in `src/lib/config.ts` and the console field together.

### Resubmission checklist

- [ ] Custom domain registered, live on Vercel, serving the homepage with a 200
- [ ] Domain verified in Search Console as a **Domain** property
- [ ] `NEXT_PUBLIC_SITE_URL` updated **and redeployed**
- [ ] Supabase Site URL and Redirect URLs updated
- [ ] Consent screen: app name `Astrologer Komal Kalra`, homepage, privacy,
      terms and authorised domain all on the new domain
- [ ] Logo uploaded (120×120 PNG)
- [ ] Open the homepage in a private window and read it as a stranger: can you
      tell what the app does and why it wants your Google account, without
      signing in?
- [ ] Resubmit

Since this app only requests `openid`, `email` and `profile` — all
non-sensitive — there is no security assessment and no restricted-scope review.
Once the homepage findings clear, approval is normally quick.

---

## What happens on first Google sign-in

1. User clicks **Continue with Google** on `/login`.
2. `signInWithGoogle` gets a URL from Supabase and redirects to Google.
3. Google returns to `https://<ref>.supabase.co/auth/v1/callback`.
4. Supabase creates the `auth.users` row and redirects to your
   `/auth/callback?next=…`.
5. `handle_new_user()` fires and creates the `profiles` row with
   **`role = 'client'`** — hardcoded, exactly as for password signup. Google
   sign-in cannot produce an admin.
6. `/auth/callback` reads the role server-side and sends admins to `/admin`,
   everyone else to `/dashboard` or their requested `next`.

### Two things worth knowing

**Name arrives, phone does not.** Google supplies `name`, `email` and
`avatar_url`. The trigger already reads
`coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')`, so the
profile name is populated. `profiles.phone` will be `null` until the client
enters it — which the booking form already asks for and writes back.

**Account linking is on `email`.** If someone signs up with a password and later
uses Google with the same address, Supabase links them to the same user by
default. That is the behaviour you want here — one person, one booking history.

---

## Testing checklist

- [ ] Sign in with Google on a fresh account → lands on `/dashboard`
- [ ] A `profiles` row exists with `role = 'client'` and the name populated
- [ ] Cancel at the Google consent screen → returns to `/login` with
      "Google sign-in was cancelled", not a generic error
- [ ] Sign in with Google from `/login?next=/book` → returns to `/book`
- [ ] Promote the account to `admin` in SQL, sign in again → lands on `/admin`
- [ ] Book a consultation as a Google user → the appointment is visible to them
      and to nobody else (this is the RLS check that matters)
- [ ] Works on `localhost:3000` as well as production
