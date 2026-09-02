-- ============================================================================
-- 32_fix_cron_url.sql — make the scheduled call trailing-slash proof
--
-- THE BUG
--
-- 31_scheduled_jobs.sql builds the request URL as `v_url || p_path`, and said
-- "no trailing slash" in a comment. NEXT_PUBLIC_SITE_URL in this project is
-- `https://komal-kalra.vercel.app/` — with one. If that same value was pasted
-- into the vault secret, every scheduled call goes to:
--
--     https://komal-kalra.vercel.app//api/cron/notifications
--                                   ^^ two slashes
--
-- which is not the same path. Depending on how the platform normalises it, that
-- is a 308 redirect that drops the Authorization header, or a 404. Either way
-- the sweep silently never runs, `cron.job_run_details` reports SUCCEEDED
-- because pg_net dispatched the request, and the only trace is a status code in
-- a table nobody thinks to look at.
--
-- Relying on a human to omit a trailing slash is not a design. Strip it here.
--
-- Safe to run whether or not the secret has a trailing slash, and safe to
-- re-run.
-- ============================================================================

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

  -- Normalise both sides so the join cannot produce '//' or omit the '/'
  -- entirely, whatever was pasted into the vault.
  v_url  := rtrim(btrim(v_url), '/');
  p_path := '/' || ltrim(p_path, '/');

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
-- Verify: fire one call right now and read the response.
--
-- Run the SELECT, wait a few seconds, then run the second query. A 200 means
-- the whole chain works — vault secret, URL, bearer token, deployed route.
-- ---------------------------------------------------------------------------
select public.call_cron_endpoint('/api/cron/notifications') as request_id;

-- Wait ~5 seconds, then run this. Note it does NOT cast content to jsonb:
-- a 404 or a platform error page is HTML, and the cast would throw
-- "invalid input syntax for type json" instead of showing you the status code
-- you actually needed to see.
--
--   select id,
--          status_code,
--          timed_out,
--          error_msg,
--          left(content, 300) as body,
--          created
--     from net._http_response
--    order by created desc limit 3;
--
-- Reading the result:
--
--   status_code 200  -> working end to end. `body` shows what each channel did.
--   status_code 401  -> the vault's cron_secret does not match the CRON_SECRET
--                       deployed on Vercel. They are separate copies.
--   status_code 404  -> wrong URL, or that route is not in the deployed commit.
--   status_code 503  -> the route booted but CRON_SECRET is unset in Vercel's
--                       environment (not just in your local .env).
--   status_code NULL -> the request never completed. Read `error_msg` and
--                       `timed_out` — this is DNS, TLS, or the host being
--                       unreachable, none of which produce a status code.
--
-- An empty result set means pg_net has not flushed the response yet. Wait and
-- re-run; it is asynchronous.
