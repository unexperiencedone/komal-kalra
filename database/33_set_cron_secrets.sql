-- ============================================================================
-- 33_set_cron_secrets.sql — put the REAL values into the vault
--
-- WHY THIS FILE EXISTS
--
-- 31_scheduled_jobs.sql created the two vault secrets with `CHANGE_ME_…`
-- placeholder values and asked, in a comment, that they be replaced before
-- running. They were not, so the vault now holds the literal string
-- `CHANGE_ME_https://your-app.vercel.app`, and every scheduled call fails with:
--
--     invalid URL "CHANGE_ME_https://your-app.vercel.app/api/cron/..." : Bad scheme
--
-- That is a bad design on my part, not a user error. A file that is meant to be
-- run should not carry values that are invalid until edited — and if it must,
-- it should refuse to run rather than write them and fail later, from three
-- frames inside pg_net, where the message names a function nobody edited.
--
-- So this file validates first and writes nothing unless both values are real.
--
-- ============================================================================
-- EDIT THE TWO VALUES ON THE NEXT LINES, THEN RUN THE WHOLE FILE.
-- ============================================================================

do $$
declare
  -- 1. Your deployed origin. Trailing slash is fine — it gets normalised.
  v_site_url text := 'https://komal-kalra.vercel.app';

  -- 2. The EXACT value of CRON_SECRET as set in Vercel's environment
  --    variables. Not your local .env if the two have drifted — pg_cron calls
  --    the deployed app, so Vercel's copy is the one that has to match.
  --    ⚠️ PASTE IT IN THE SQL EDITOR, DO NOT SAVE IT INTO THIS FILE.
  --    This file is tracked by git. `.env` is gitignored; `database/*.sql` is
  --    not, so a real value left here goes into the repository — and into
  --    GitHub the moment you push. Git history is not edited by deleting the
  --    line later; the secret stays in every earlier commit.
  v_cron_secret text := 'CHANGE_ME';

  v_id uuid;
begin
  -- ---- Refuse rather than write something that cannot work ----------------
  if v_site_url like 'CHANGE_ME%' or v_cron_secret like 'CHANGE_ME%' then
    raise exception
      'Replace both values at the top of 33_set_cron_secrets.sql before running it. Nothing was changed.';
  end if;

  if v_site_url !~ '^https://[a-z0-9.-]+' then
    raise exception
      'site_url must be an https:// origin, e.g. https://komal-kalra.vercel.app — got "%"', v_site_url;
  end if;

  if v_site_url ~ '/api/' then
    raise exception
      'site_url must be the ORIGIN only, with no path. Got "%"', v_site_url;
  end if;

  if length(v_cron_secret) < 16 then
    raise exception
      'cron_secret looks too short (% chars). The app requires at least 16.', length(v_cron_secret);
  end if;

  -- ---- site_url -----------------------------------------------------------
  select id into v_id from vault.secrets where name = 'site_url';
  if v_id is null then
    perform vault.create_secret(v_site_url, 'site_url',
      'Deployed origin used by scheduled jobs to call the app');
  else
    perform vault.update_secret(v_id, v_site_url);
  end if;

  -- ---- cron_secret --------------------------------------------------------
  select id into v_id from vault.secrets where name = 'cron_secret';
  if v_id is null then
    perform vault.create_secret(v_cron_secret, 'cron_secret',
      'Bearer token for /api/cron/* — must match CRON_SECRET in Vercel');
  else
    perform vault.update_secret(v_id, v_cron_secret);
  end if;

  raise notice 'Vault updated. site_url = %', v_site_url;
end $$;

-- ---------------------------------------------------------------------------
-- Harden the caller so a bad value can never again surface as "Bad scheme"
-- from inside pg_net. Fail where the mistake is, with a message that names it.
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

  v_url  := rtrim(btrim(v_url), '/');
  p_path := '/' || ltrim(p_path, '/');

  -- The check that was missing. A scheduled job runs unattended, so an
  -- unusable URL must announce itself in the Postgres log with the reason,
  -- not as a generic parse failure attributed to net.http_post.
  if v_url !~ '^https?://' then
    raise warning
      'call_cron_endpoint: site_url is not a URL ("%"). Run database/33_set_cron_secrets.sql. Skipping %',
      left(v_url, 40), p_path;
    return null;
  end if;

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
-- Confirm the vault holds real values now. Shows only a prefix, so the bearer
-- token is not printed into your SQL editor history.
-- ---------------------------------------------------------------------------
select name,
       left(decrypted_secret, 14) || '…' as starts_with,
       length(decrypted_secret)          as len,
       (decrypted_secret like 'CHANGE_ME%') as still_placeholder
  from vault.decrypted_secrets
 where name in ('site_url', 'cron_secret')
 order by name;

-- ---------------------------------------------------------------------------
-- Then fire one real call and read the result.
-- ---------------------------------------------------------------------------
select public.call_cron_endpoint('/api/cron/notifications') as request_id;

-- Wait ~5 seconds:
--
--   select id, status_code, timed_out, error_msg, left(content, 300) as body, created
--     from net._http_response
--    order by created desc limit 3;
--
--   200  -> working end to end.
--   401  -> this cron_secret does not match CRON_SECRET in Vercel.
--   404  -> route not in the deployed commit — push first.
--   503  -> CRON_SECRET is unset in Vercel's environment.
--   NULL -> never completed; read error_msg (DNS, TLS, host unreachable).
