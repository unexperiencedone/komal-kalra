-- ============================================================================
-- 31_scheduled_jobs.sql — the periodic sweep, run from Postgres
--
-- WHAT STILL NEEDS A SCHEDULE, now that confirmations do not
--
-- Booking confirmations are sent by `after()` the moment the payment settles
-- (src/lib/notifications/flush.ts), so nothing urgent waits on a timer any
-- more. Two things genuinely cannot work that way:
--
--   · REMINDERS. A row scheduled for 24 hours before an appointment has
--     nothing to wake it up. No request is happening at that moment.
--   · RETRIES. A send that failed leaves a `failed` row, and something has to
--     come back for it.
--
-- Neither is urgent to the minute, so a five-minute sweep is ample.
--
-- WHY HERE AND NOT vercel.json
--
-- Vercel's Hobby plan caps cron at ONCE PER DAY, and a more frequent expression
-- fails at deploy time — so scheduling this on Vercel silently requires a paid
-- plan. pg_cron ships enabled on every Supabase project including the free
-- tier, so putting the schedule in the database removes that dependency
-- entirely. It also keeps the schedule next to the data it operates on.
--
-- If you are on Vercel Pro and would rather use vercel.json, that works too —
-- use one or the other, not both, or every message is attempted twice.
--
-- ============================================================================
-- BEFORE RUNNING: three values must be filled in below.
--   :site_url    your deployed origin, e.g. https://komalkalra.vercel.app
--   :cron_secret the CRON_SECRET from your environment variables
-- Search for CHANGE_ME. The job is not created until you do.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- The secret is read from Vault, not pasted into the job definition.
--
-- cron.job is a readable table. A bearer token written directly into the
-- command is then stored in plaintext and visible to anything that can select
-- from it — and it is the token that authorises /api/cron/reconcile, which
-- touches money-adjacent state. Vault keeps it encrypted at rest and out of
-- the job body.
-- ---------------------------------------------------------------------------
select vault.create_secret(
  'CHANGE_ME_cron_secret',        -- the value of CRON_SECRET
  'cron_secret',
  'Bearer token for /api/cron/* — must match CRON_SECRET in the app environment'
)
where not exists (select 1 from vault.decrypted_secrets where name = 'cron_secret');

select vault.create_secret(
  'CHANGE_ME_https://your-app.vercel.app',   -- no trailing slash
  'site_url',
  'Deployed origin used by scheduled jobs to call the app'
)
where not exists (select 1 from vault.decrypted_secrets where name = 'site_url');

-- ---------------------------------------------------------------------------
-- One function, so the job body stays short and the secrets are looked up at
-- run time rather than frozen into the schedule.
-- ---------------------------------------------------------------------------
create or replace function public.call_cron_endpoint(p_path text)
returns bigint
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'site_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';

  if v_url is null or v_secret is null then
    raise warning 'call_cron_endpoint: site_url or cron_secret missing from vault; skipping %', p_path;
    return null;
  end if;

  -- pg_net is ASYNCHRONOUS. This returns a request id immediately and does not
  -- block the scheduler on a slow response, which is what we want: a hung
  -- endpoint must not back up every other job on the instance.
  return net.http_post(
    url     => v_url || p_path,
    headers => jsonb_build_object(
                 'Authorization', 'Bearer ' || v_secret,
                 'Content-Type',  'application/json'
               ),
    body    => '{}'::jsonb,
    timeout_milliseconds => 30000
  );
end;
$$;

revoke all on function public.call_cron_endpoint(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Schedules. UTC, like all pg_cron schedules.
--
-- Unscheduled first so re-running this file cannot create duplicates — two
-- identical jobs would double every retry attempt.
-- ---------------------------------------------------------------------------
select cron.unschedule('drain-notification-outbox')
 where exists (select 1 from cron.job where jobname = 'drain-notification-outbox');

select cron.schedule(
  'drain-notification-outbox',
  '*/5 * * * *',
  $$select public.call_cron_endpoint('/api/cron/notifications')$$
);

select cron.unschedule('reconcile-payments')
 where exists (select 1 from cron.job where jobname = 'reconcile-payments');

-- Every 15 minutes. This is a safety net for payments that neither the browser
-- nor the webhook settled, plus stale-hold cleanup — rare enough that a longer
-- interval is fine, money-related enough that it must not be daily.
select cron.schedule(
  'reconcile-payments',
  '*/15 * * * *',
  $$select public.call_cron_endpoint('/api/cron/reconcile')$$
);

-- ---------------------------------------------------------------------------
-- Verify.
-- ---------------------------------------------------------------------------
select jobid, jobname, schedule, active from cron.job order by jobname;

-- After a few minutes, check the runs actually happened:
--   select jobname, status, return_message, start_time
--     from cron.job_run_details
--    order by start_time desc limit 10;
--
-- And that the HTTP calls got a 200 back:
--   select id, status_code, created
--     from net._http_response
--    order by created desc limit 10;
