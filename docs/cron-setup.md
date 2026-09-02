# Scheduled jobs

## Do you need them?

**Not for booking confirmations.** Those now fire the moment a payment settles.

`settlePayment()` queues the messages and then calls `flushOutboxAfterResponse()`,
which uses Next.js `after()` to drain the outbox **once the HTTP response has
already been sent**. So the client gets their WhatsApp and email within seconds
of paying, and nothing the sender does can change the status code Razorpay
sees — which was the entire reason the outbox was queue-first in the first
place.

That distinction matters. The original rule was *"never send inline from a
webhook, or an SMTP failure makes Razorpay redeliver the payment event
forever"*. That is correct. It had quietly become *"only a cron may send"*,
which is a different and worse rule: it made every confirmation wait for the
next sweep and put the whole feature behind a paid Vercel plan.

**You do still need a periodic sweep, for two things `after()` cannot do:**

| | Why a request cannot do it |
|---|---|
| **Reminders** | A row scheduled for 24 h before an appointment has nothing to wake it up — no request is happening then. |
| **Retries** | A send that failed leaves a `failed` row. Something has to come back for it. |

Neither is urgent to the minute. **Every five minutes is ample**, versus the
every-minute schedule the old design needed.

---

## The sweep: run it from Supabase, not Vercel

`database/31_scheduled_jobs.sql` schedules it with **pg_cron**, which ships
enabled on every Supabase project **including the free tier**.

This is deliberate. **Vercel's Hobby plan caps cron at once per day**, and a more
frequent expression *fails at deploy time* — so putting the schedule in
`vercel.json` silently requires Vercel Pro. Nothing else in this project does,
and a once-daily drain would mean reminders arriving up to a day late, which is
worse than not sending them.

### Setting it up

1. Open `database/31_scheduled_jobs.sql`.
2. Replace the two `CHANGE_ME` values: your `CRON_SECRET`, and your deployed
   origin (no trailing slash).
3. Run it in the Supabase SQL editor.

The secrets go into **Supabase Vault**, not into the job body. `cron.job` is a
readable table; a bearer token pasted straight into the command sits there in
plaintext, and that token authorises `/api/cron/reconcile`, which touches
money-adjacent state.

### Checking it works

```sql
-- the jobs exist and are active
select jobname, schedule, active from cron.job order by jobname;

-- they are actually running
select jobname, status, return_message, start_time
  from cron.job_run_details order by start_time desc limit 10;

-- and the app returned 200
select id, status_code, created
  from net._http_response order by created desc limit 10;
```

`pg_net` is asynchronous — `net.http_post` returns a request id immediately, so
a slow endpoint cannot back up the scheduler. That means a job showing
`succeeded` only tells you the request was *dispatched*; `net._http_response` is
where you see what the app actually said.

---

## If you would rather use Vercel Pro

Create `vercel.json` and skip the pg_cron half of `31_scheduled_jobs.sql`:

```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/reconcile",     "schedule": "*/15 * * * *" }
  ]
}
```

**Use one or the other, never both** — two schedulers hitting the same endpoint
means every retry is attempted twice, and on WhatsApp every delivered message is
billed.

Vercel adds `Authorization: Bearer $CRON_SECRET` automatically when
`CRON_SECRET` exists as a project environment variable. You do not configure the
header anywhere.

---

## Authentication

Both routes require `Authorization: Bearer $CRON_SECRET` and refuse to run in
production without `CRON_SECRET` set. Without it they are public endpoints, and
`/api/cron/reconcile` is not merely noisy to leave open.

To drive them from anywhere else — cron-job.org, GitHub Actions, a box you
own — the call is just:

```bash
curl -fsS -X POST https://your-domain.com/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## When something is stuck

```sql
select channel, status, count(*), max(created_at) as newest
  from public.notification_outbox
 group by channel, status
 order by channel, status;
```

- `queued`, `attempts = 0`, older than a few minutes → the sweep is not running.
- `queued` on the whatsapp channel with `attempts = 0` → WhatsApp credentials
  are missing. Rows deliver themselves once configured; nothing is lost.
- `failed` with a `last_error` → read it; template and phone-format problems
  both surface here.
- `sent` that never becomes `delivered` → the WhatsApp webhook is not wired up.
  See `docs/whatsapp-setup.md` §4a.
