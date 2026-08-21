#!/usr/bin/env node
/**
 * Live check for the astrology integration. Run it on YOUR machine — it makes
 * real calls and spends real credits.
 *
 *   npm run astrology:check
 *
 * Spends roughly 60 credits of the 5,000/month free tier: one birth chart (50)
 * and one panchang (10). Geocoding is free and unmetered.
 *
 * It never prints a secret. Credentials are reported as present/absent and by
 * length only — a check script that echoes a key into a terminal, a CI log or a
 * screen share is its own security incident.
 */
import { setTimeout as sleep } from 'node:timers/promises';

const ID = process.env.PROKERALA_CLIENT_ID;
const SECRET = process.env.PROKERALA_CLIENT_SECRET;

const pass = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const info = (m: string) => console.log(`    ${m}`);
const head = (m: string) => console.log(`\n\x1b[1m${m}\x1b[0m`);

let failures = 0;

/* ---------------------------------------------------------------------- */
head('1. Credentials');

if (!ID || !SECRET) {
  fail('PROKERALA_CLIENT_ID / PROKERALA_CLIENT_SECRET not found in the environment.');
  info('This script reads .env via `node --env-file`. Check the npm script, and');
  info('that the values are in .env (or .env.local) with no surrounding quotes.');
  process.exit(1);
}
pass(`Client ID present (${ID.length} chars)`);
pass(`Client secret present (${SECRET.length} chars)`);

/* ---------------------------------------------------------------------- */
head('2. Token (OAuth2 client credentials)');

let token = '';
try {
  const res = await fetch('https://api.prokerala.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ID,
      client_secret: SECRET,
    }),
  });

  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };

  if (!res.ok || !json.access_token) {
    failures++;
    fail(`HTTP ${res.status}${json.error ? ` — ${json.error}` : ''}`);
    if (res.status === 401) {
      info('401 means the id or secret is wrong, or the client was deleted in');
      info('the Prokerala dashboard. Regenerate under Dashboard → Clients.');
    }
    process.exit(1);
  }

  token = json.access_token;
  pass(`Token issued, expires in ${json.expires_in ?? '?'}s`);
  info(`The client caches this with a 60s safety margin, so it refreshes at ~${(json.expires_in ?? 3600) - 60}s.`);
} catch (error) {
  failures++;
  fail(`Could not reach api.prokerala.com — ${(error as Error).message}`);
  process.exit(1);
}

/* ---------------------------------------------------------------------- */
head('3. Place lookup (Open-Meteo — no key needed)');

let place = { label: '', latitude: 0, longitude: 0, timezone: '' };
try {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', 'Kanpur');
  url.searchParams.set('count', '3');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url);
  const json = (await res.json()) as {
    results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone: string }[];
  };

  const first = json.results?.[0];
  if (!first) {
    failures++;
    fail('No results for "Kanpur" — the geocoder is reachable but returned nothing.');
  } else {
    place = {
      label: [first.name, first.admin1, first.country].filter(Boolean).join(', '),
      latitude: Number(first.latitude.toFixed(4)),
      longitude: Number(first.longitude.toFixed(4)),
      timezone: first.timezone,
    };
    pass(`${json.results!.length} match(es) for "Kanpur"`);
    for (const r of json.results!) {
      info(`${[r.name, r.admin1, r.country].filter(Boolean).join(', ')}  →  ${r.latitude}, ${r.longitude}  ${r.timezone}`);
    }
    // The timezone is the reason this provider was chosen — flag it loudly if
    // it ever stops coming back, because a chart on the wrong offset is wrong
    // in a way that looks completely plausible.
    if (!place.timezone) {
      failures++;
      fail('No timezone returned. Birth charts would be computed on the wrong offset.');
    }
  }
} catch (error) {
  failures++;
  fail(`Geocoder unreachable — ${(error as Error).message}`);
}

/* ---------------------------------------------------------------------- */
head('4. Birth chart (costs ~50 credits)');

/** Same offset logic as src/lib/astrology/prokerala.ts. */
function isoWithOffset(date: string, time: string, timezone: string): string {
  const naive = new Date(`${date}T${time}:00Z`);
  const part =
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(naive)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  return `${date}T${time}:00${part.replace('GMT', '') || '+00:00'}`;
}

const DATE = '1990-03-24';
const TIME = '14:30';
const datetime = isoWithOffset(DATE, TIME, place.timezone || 'Asia/Kolkata');
info(`datetime  ${datetime}`);
info(`place     ${place.label || 'Kanpur (fallback)'} @ ${place.latitude},${place.longitude}`);

async function call(path: string, params: Record<string, string>) {
  const url = new URL(`https://api.prokerala.com/v2/astrology${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.text();
  return { status: res.status, body };
}

try {
  const { status, body } = await call('/kundli', {
    datetime,
    coordinates: `${place.latitude || 26.4499},${place.longitude || 80.3319}`,
    ayanamsa: '1',
  });

  if (status !== 200) {
    failures++;
    fail(`HTTP ${status}`);
    if (status === 429) info('Rate limited — the free tier allows 5 requests/minute. Wait and retry.');
    if (status === 402 || status === 403) info('Credits exhausted for this month. Check Dashboard → Usage.');
    info(body.slice(0, 400));
  } else {
    const json = JSON.parse(body);
    const d = json?.data ?? json;
    const nak = d?.nakshatra_details;
    pass('Chart returned');
    info(`Moon sign   ${nak?.chandra_rasi?.name ?? '—'}`);
    info(`Sun sign    ${nak?.soorya_rasi?.name ?? '—'}`);
    info(`Nakshatra   ${nak?.nakshatra?.name ?? '—'}${nak?.nakshatra?.pada ? `, pada ${nak.nakshatra.pada}` : ''}`);
    info(`Zodiac      ${nak?.zodiac?.name ?? '—'}`);

    // The mapper reads these exact paths. If they are all empty the provider
    // has reshaped its response and src/lib/astrology/prokerala.ts needs
    // updating — the tool would otherwise render a blank result with no error.
    if (!nak?.chandra_rasi?.name && !nak?.nakshatra?.name) {
      failures++;
      fail('Response shape does not match the mapper. Check the raw body below.');
      info(body.slice(0, 600));
    }
  }
} catch (error) {
  failures++;
  fail(`Chart call failed — ${(error as Error).message}`);
}

// The free tier allows 5 requests/minute; two calls back to back is fine, but
// pause so a retry of this script does not trip the limit.
await sleep(1200);

/* ---------------------------------------------------------------------- */
head('5. Panchang (costs ~10 credits)');

try {
  const { status, body } = await call('/panchang', {
    datetime: `${new Date().toISOString().slice(0, 10)}T06:00:00+05:30`,
    coordinates: `${place.latitude || 26.4499},${place.longitude || 80.3319}`,
    ayanamsa: '1',
  });

  if (status !== 200) {
    failures++;
    fail(`HTTP ${status}`);
    info(body.slice(0, 400));
  } else {
    const d = JSON.parse(body)?.data ?? JSON.parse(body);
    pass('Panchang returned');
    info(`Sunrise     ${d?.sunrise ?? '—'}`);
    info(`Sunset      ${d?.sunset ?? '—'}`);
    info(`Tithi       ${d?.tithi?.[0]?.name ?? '—'}`);
    info(`Nakshatra   ${d?.nakshatra?.[0]?.name ?? '—'}`);
    info(`Yoga        ${d?.yoga?.[0]?.name ?? '—'}`);
    info(`Karana      ${d?.karana?.[0]?.name ?? '—'}`);
  }
} catch (error) {
  failures++;
  fail(`Panchang call failed — ${(error as Error).message}`);
}

/* ---------------------------------------------------------------------- */
head('Summary');
if (failures) {
  console.log(`  ${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log('  All live checks passed.');
console.log('  Spent ~60 credits. Check Dashboard → Usage to confirm.\n');
console.log('  Next: run database/23_astrology_cache.sql, then submit the same');
console.log('  birth details twice at /free-tools/free-kundli — the second run');
console.log('  should be instant and cost nothing.\n');
