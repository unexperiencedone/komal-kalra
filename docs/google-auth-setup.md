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

### 2. Authorised redirect URI

This is the step people get wrong. The redirect goes to **Supabase**, not to
your site:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Find `<your-project-ref>` in Supabase → Project Settings → General.

Add **only** that URI here. Your own `/auth/callback` route is where Supabase
sends the user *afterwards*, and it does not belong in this field.

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
