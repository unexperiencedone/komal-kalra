# Free tools — where to get the API keys

Two services power `/free-tools/*`. One needs an account, the other needs
nothing at all.

---

## 1. Prokerala — birth charts, matching, dosha, panchang

**Sign up:** <https://api.prokerala.com/>

1. Create an account (email + password; no card required for the free tier).
2. **Dashboard → Clients → New Client.**
3. Name it anything — it is internal. It will ask for a redirect URL; leave it
   blank or use your site URL. This integration uses the *client credentials*
   grant, which has no redirect step.
4. Copy the **Client ID** and **Client Secret**.

```env
PROKERALA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROKERALA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add both in **Vercel → Project → Settings → Environment Variables**, then
**redeploy**. They are read server-side at request time, so unlike
`NEXT_PUBLIC_SITE_URL` they do not need a rebuild — but a redeploy is the
simplest way to be sure the running instance has them.

> ⚠️ **Never prefix these with `NEXT_PUBLIC_`.** That prefix is what tells
> Next.js to inline a value into the browser bundle. These are credentials; in
> a bundle they are simply published, and anyone can spend your credits.

### The credit budget — the number that shaped the architecture

Free tier: **5,000 credits/month, 5 requests/minute.** Paid starts at ~₹999/mo
for 100,000 credits.

| Call | Credits |
|---|---|
| Panchang | 10 |
| Birth chart | 50 |
| Mangal Dosha | 30 |
| Kundli matching | 50–100 |

At 50 credits a chart, the free tier is **100 birth charts a month**. That is
fine for a starting site and nowhere near enough if a tool goes viral, so watch
the dashboard rather than the site.

**This is why there is a cache table.** Uncached, a Panchang widget on a public
page would spend the entire monthly allowance in about 500 page views. Cached
per `(date, city)` for a day, the same widget costs 10 credits per city per day
— roughly 3,600 a *year* for a dozen cities. Birth charts are cached forever,
because the same birth moment always produces the same chart and paying twice
for it is waste.

Run the migration or the cache silently does nothing:

```
database/23_astrology_cache.sql
```

It is idempotent. Without it, every tool still works — the cache degrades to
calling the provider directly and logs the failure — but the credit budget will
not last.

### Rate limits

Prokerala allows **5 requests/minute** on the free tier. Two protections:

- The route handler caps each visitor at 12 calculations per 10 minutes.
- A 429 from Prokerala is surfaced as a "the service is busy, try again in a
  moment" message rather than a generic error, and is never retried in a loop —
  that is how a rate limit becomes a ban.

---

## 2. Open-Meteo — place lookup

**Nothing to sign up for. No key. No account.**
<https://open-meteo.com/en/docs/geocoding-api>

Prokerala wants coordinates, not "Kanpur". Visitors know the name of the town
they were born in and never know its latitude, so something has to bridge the
two.

Open-Meteo's geocoding endpoint is free for commercial and non-commercial use
and — the part that actually decided it — **returns the IANA timezone along
with the coordinates**. Birth time is meaningless without the zone it was
recorded in, and a chart computed with the wrong offset is wrong in a way that
looks entirely plausible. Google Geocoding is more precise for street
addresses, but needs a billing account and a second key to protect, for a
town-centroid lookup that gets rounded anyway.

Results are cached for 30 days by `next: { revalidate }` — town coordinates do
not move.

---

## What needs no API at all

Four tools are pure arithmetic in `src/lib/astrology/numerology.ts`:

- Numerology (psychic / destiny / name numbers)
- Name number
- Lo Shu grid
- FLAMES — labelled as a game, not astrology

They cost nothing per use, cannot rate-limit, and cannot break when a vendor
has an outage. **They were built first deliberately**, so the tool pages had a
working pattern before any integration existed.

---

## Verifying it works

1. Add the two variables and redeploy.
2. Open `/free-tools/free-kundli`.
3. Type a city — the place list should appear within a second. If it does not,
   the problem is Open-Meteo or the network, *not* your Prokerala key.
4. Fill in a date and time, accept the consent box, submit.
5. Submit **the same details again**. The second run should be instant: it is a
   cache hit and costs zero credits. If it is slow again, the migration has not
   run.
6. Check **Prokerala Dashboard → Usage**. One chart should have cost ~50
   credits, not two.

### If something is wrong

| Symptom | Cause |
|---|---|
| "The astrology service is not connected yet" | Variables missing on the running deployment. Set them, then redeploy |
| "Could not authenticate with the astrology provider" | Client ID or secret wrong, or the client was deleted in their dashboard |
| "The astrology service is busy" | 5 req/min ceiling. Wait a minute |
| "temporarily unavailable" | Credits exhausted for the month — check Usage |
| Place lookup returns nothing | Open-Meteo unreachable, or fewer than 2 characters typed |
| Same request bills twice | `23_astrology_cache.sql` has not been run |

---

## Before this goes live

The tools collect **name, email, optional phone, and date/time/place of
birth**. That is a substantial personal-data collection under India's DPDP Act,
and two things are already true in the code but need to be true in the
documents as well:

1. **Birth details are not stored.** They are used to compute the result and
   discarded; only the name, email and *which tool was used* reach the `leads`
   table. See the note at the top of `src/lib/astrology/leads.ts` — that limit
   is deliberate and should not be widened without a consent change.
2. **Consent is server-enforced**, not just a disabled button: the schema uses
   `z.literal(true)`, so a submission without it is rejected by the API.

Still outstanding:

- [ ] Add a free-tools section to `src/lib/content/legal.ts`, then run
      `npm run legal:export`
- [ ] Add a row to `docs/legal-compliance.md` §5.2 (where consent is captured)
- [ ] Decide a retention period for tool leads, and a job that honours it

Sources: [Prokerala API](https://api.prokerala.com/) ·
[Prokerala pricing](https://api.prokerala.com/pricing) ·
[Prokerala credits](https://api.prokerala.com/api-credits) ·
[Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api)
