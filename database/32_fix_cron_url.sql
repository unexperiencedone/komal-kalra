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

-- Wait ~5 seconds, then:
--
--   select id, status_code, (content::jsonb) as body, created
--     from net._http_response
--    order by created desc limit 3;
--
--   200 -> working. `body` shows what each channel did.
--   401 -> CRON_SECRET in the vault does not match the one deployed on Vercel.
--   404 -> URL is wrong, or that commit is not deployed yet.
--   503 -> the route booted but CRON_SECRET is not set in the Vercel
--          environment at all.
