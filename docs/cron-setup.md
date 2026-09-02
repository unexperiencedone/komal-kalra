# Scheduled jobs

`vercel.json` defines two. Without them **nothing is ever sent** — every
confirmation, WhatsApp message and reminder is written to
`notification_outbox` and sits there `queued` forever. The queue design is
deliberate (a mail outage must never affect whether a payment settles), but a
queue with no worker is just a table.

| Path | Schedule | What it does |
|---|---|---|
| `/api/cron/notifications` | every minute | drains the outbox — email and WhatsApp |
| `/api/cron/reconcile` | every 15 min | expires stale slot holds, catches payments both the browser and the webhook missed |

## ⚠️ This needs a Vercel Pro plan

**Hobby caps cron at once per day**, and a cron expression that fires more often
than that **fails at deploy time** — so `vercel.json` as written will not deploy
on Hobby. Hobby timing is also only guaranteed within the hour, and all
schedules are UTC.

A once-daily drain is not a degraded version of this feature, it is a different
one: a client pays at 10am and their WhatsApp confirmation arrives tomorrow.
Given the site tells them it is on its way, that is worse than not sending it.

If you are staying on Hobby, drive the worker externally instead — any scheduler
that can make an authenticated HTTPS request every minute (cron-job.org, GitHub
Actions, an always-on box):

```bash
curl -fsS -X POST https://your-domain.com/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

Then remove the `crons` array from `vercel.json` so the deploy succeeds.

## Authentication

Both routes require `Authorization: Bearer $CRON_SECRET` and refuse to run in
production without `CRON_SECRET` set. **Vercel adds that header automatically**
when `CRON_SECRET` exists as an environment variable on the project — you do not
configure it anywhere in the cron settings. Set the variable, and it works.

Without it these are public endpoints. `/api/cron/reconcile` moves money-adjacent
state, so an open one is not merely noisy.

## Checking it is running

Vercel dashboard → project → **Cron Jobs** shows the last run and its response.
A healthy notifications run returns both channels separately:

```json
{ "ok": true, "data": { "email": { "sent": 1 }, "whatsapp": { "sent": 2 } } }
```

`{ "whatsapp": { "skipped": 3 } }` means the WhatsApp credentials are missing —
the rows stay queued and will deliver themselves once configured.

Or from SQL:

```sql
select channel, status, count(*), max(created_at) as newest
  from public.notification_outbox
 group by channel, status
 order by channel, status;
```

Rows stuck at `queued` with `attempts = 0` and a `created_at` older than a few
minutes mean the worker is not running at all.
