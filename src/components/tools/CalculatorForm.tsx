'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { coreNumbers, loShuGrid, nameNumber, flames } from '@/lib/astrology/numerology';

/**
 * The free-tool forms.
 *
 * ⚠️  THE OTP STEP THAT USED TO BE HERE IS GONE, ON PURPOSE.
 *
 * It rendered a "we sent a 4-digit code to your phone" screen and then accepted
 * literally any input, because no code was ever sent. That is a placeholder
 * impersonating a security control — it teaches visitors that our verification
 * means nothing, and it is exactly the "placeholder functionality presented as
 * working" the brief rules out. There is also nothing here worth verifying: a
 * calculator is not an account.
 *
 * SHAPE OF EVERY TOOL
 *
 *   pure-arithmetic tools  → compute in the browser, no network, no email gate
 *   provider-backed tools  → birth details + contact, POST to /api/astrology
 *
 * The arithmetic tools deliberately do NOT ask for an email. Gating a sum
 * behind a form is friction with nothing behind it, and the API-backed tools
 * are where a lead is actually worth capturing.
 */

type Place = { label: string; latitude: number; longitude: number; timezone: string };

const NUMEROLOGY_TOOLS = new Set(['numerology', 'name-number', 'lo-shu-grid', 'flames']);

export function CalculatorForm({ toolSlug }: { toolSlug: string }) {
  if (NUMEROLOGY_TOOLS.has(toolSlug)) return <NumerologyTool slug={toolSlug} />;
  return <BirthTool slug={toolSlug} />;
}

/* ========================================================================== */
/*  Place lookup                                                              */
/* ========================================================================== */

/**
 * Typeahead against our own /api/astrology/places proxy.
 *
 * The selected place is held as an OBJECT, not a string. A chart needs
 * coordinates and a timezone, and "Hyderabad" is a real city in two countries
 * — resolving silently to the first match is how a tool returns a confident,
 * wrong answer. Nothing can be submitted until a place has actually been
 * chosen from the list.
 */
function PlaceField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clearing is deferred rather than set synchronously in the effect body —
    // a synchronous setState here cascades an extra render on every keystroke,
    // which on a typeahead is every character the visitor types.
    if (value || query.trim().length < 2) {
      const clear = window.setTimeout(() => setOptions([]), 0);
      return () => window.clearTimeout(clear);
    }

    // Debounced, and the previous request is aborted. Without the abort a slow
    // early response can land after a fast later one and repopulate the list
    // with results for a query the user has already moved past.
    const timer = window.setTimeout(async () => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/astrology/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.ok) {
          setOptions(json.data.places);
          setOpen(true);
        }
      } catch {
        /* aborted or offline — the field simply shows no suggestions */
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, value]);

  return (
    <div className="relative">
      <Field label={label} htmlFor={id} required>
        <Input
          id={id}
          value={value ? value.label : query}
          onChange={(e) => {
            onChange(null);
            setQuery(e.target.value);
          }}
          placeholder="Start typing a town or city"
          autoComplete="off"
          required
        />
      </Field>

      {loading && !value && (
        <p className="mt-1 text-xs text-[var(--color-body-warm)] opacity-70">Searching…</p>
      )}

      {open && !value && options.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-[var(--color-hairline)] bg-[var(--color-cream)] shadow-lg">
          {options.map((place) => (
            <li key={`${place.label}-${place.latitude}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(place);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-card-cream)]"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!value && query.trim().length >= 2 && !loading && options.length === 0 && (
        <p className="mt-1 text-xs text-[var(--color-body-warm)] opacity-70">
          No match yet — try the nearest larger town.
        </p>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Birth-details tools                                                       */
/* ========================================================================== */

interface BirthState {
  date: string;
  time: string;
  place: Place | null;
}

const emptyBirth: BirthState = { date: '', time: '', place: null };

function BirthFields({
  prefix,
  state,
  onChange,
}: {
  prefix: string;
  state: BirthState;
  onChange: (next: BirthState) => void;
}) {
  const id = (part: string) => `${prefix}-${part}`;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Date of birth" htmlFor={id('date')} required>
          <Input
            id={id('date')}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={state.date}
            onChange={(e) => onChange({ ...state, date: e.target.value })}
            required
          />
        </Field>
        <Field
          label="Time of birth"
          htmlFor={id('time')}
          required
          hint="If you are not sure, use your best estimate — the reading still works."
        >
          <Input
            id={id('time')}
            type="time"
            value={state.time}
            onChange={(e) => onChange({ ...state, time: e.target.value })}
            required
          />
        </Field>
      </div>
      <PlaceField
        id={id('place')}
        label="Place of birth"
        value={state.place}
        onChange={(place) => onChange({ ...state, place })}
      />
    </div>
  );
}

const MATCHING = 'kundli-matching';

function BirthTool({ slug }: { slug: string }) {
  const isMatching = slug === MATCHING;

  const [primary, setPrimary] = useState<BirthState>(emptyBirth);
  const [secondary, setSecondary] = useState<BirthState>(emptyBirth);
  const [lead, setLead] = useState({ name: '', email: '', phone: '', consent: false, website: '' });

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const ready =
    Boolean(primary.date && primary.time && primary.place) &&
    (!isMatching || Boolean(secondary.date && secondary.time && secondary.place)) &&
    lead.name.trim() &&
    lead.email.trim() &&
    lead.consent;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    setStatus('loading');
    setMessage('');

    const birth = (s: BirthState) => ({ date: s.date, time: s.time, place: s.place });
    const payload = isMatching
      ? { tool: 'matching', slug, bride: birth(primary), groom: birth(secondary), lead }
      : slug === 'mangal-dosha'
        ? { tool: 'mangal-dosha', slug, birth: birth(primary), lead }
        : { tool: 'chart', slug, birth: birth(primary), lead };

    try {
      const res = await fetch('/api/astrology/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.ok) {
        setStatus('error');
        // The API writes these messages for a visitor to read, so they are
        // shown as-is rather than replaced with something generic.
        setMessage(json.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setResult(json.data.result);
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage('Could not reach the service. Please check your connection and try again.');
    }
  }

  if (status === 'done') {
    return <ResultPanel slug={slug} result={result} onReset={() => setStatus('idle')} />;
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <section className="space-y-6">
        <h2 className="border-b border-[var(--color-hairline)] pb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">
          {isMatching ? 'Bride’s details' : 'Birth details'}
        </h2>
        <BirthFields prefix="primary" state={primary} onChange={setPrimary} />
      </section>

      {isMatching && (
        <section className="space-y-6">
          <h2 className="border-b border-[var(--color-hairline)] pb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">
            Groom’s details
          </h2>
          <BirthFields prefix="secondary" state={secondary} onChange={setSecondary} />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="border-b border-[var(--color-hairline)] pb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">
          Your details
        </h2>

        {/*
          NOT "where should we send it?".

          Nothing is emailed. The result renders on this page and the contact
          details go to `leads` so Komal can follow up by hand. Promising a
          delivery the system does not perform is the same class of lie as the
          fake OTP that used to live in this file — and it is worse, because the
          visitor waits for something that is never coming.

          When the outbox actually sends (RESEND_API_KEY + a verified domain),
          queue a `tool_result` notification here and this heading can change
          back.
        */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field label="Your name" htmlFor="lead-name" required>
            <Input
              id="lead-name"
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Email" htmlFor="lead-email" required>
            <Input
              id="lead-email"
              type="email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
              required
            />
          </Field>
          {/* Optional on purpose — a required phone number on a free tool
              suppresses completion, and email is enough to follow up. */}
          <Field label="Phone (optional)" htmlFor="lead-phone">
            <Input
              id="lead-phone"
              type="tel"
              value={lead.phone}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            />
          </Field>
        </div>

        {/* Honeypot. Hidden from people, irresistible to bots. Not `display:
            none` — some bots skip those; off-screen and aria-hidden works on
            more of them without ever reaching a screen reader. */}
        <div aria-hidden className="absolute left-[-9999px]" >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={lead.website}
            onChange={(e) => setLead({ ...lead, website: e.target.value })}
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-body-warm)]">
          <input
            type="checkbox"
            checked={lead.consent}
            onChange={(e) => setLead({ ...lead, consent: e.target.checked })}
            required
            className="mt-1 accent-[var(--color-saffron-deep)]"
          />
          <span>
            I agree to the{' '}
            <a href="/legal/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              privacy policy
            </a>
            . My birth details are used to produce this result and are not stored.
          </span>
        </label>
      </section>

      {status === 'error' && (
        <p role="alert" className="border-l-2 border-[var(--color-error)] py-1 pl-4 text-sm text-[var(--color-error)]">
          {message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        variant="primary"
        disabled={!ready || status === 'loading'}
        loading={status === 'loading'}
        loadingText="Calculating…"
        className="w-full md:w-auto"
      >
        Calculate
      </Button>
    </form>
  );
}

/* ========================================================================== */
/*  Results                                                                   */
/* ========================================================================== */

function ResultPanel({
  slug,
  result,
  onReset,
}: {
  slug: string;
  result: unknown;
  onReset: () => void;
}) {
  const rows: { label: string; value: string }[] = [];
  const r = result as Record<string, unknown> | null;

  if (r) {
    if (slug === MATCHING) {
      rows.push({ label: 'Total points', value: `${r.obtained ?? '—'} / ${r.maximum ?? 36}` });
      for (const k of (r.kootas as { name: string; obtained: number; maximum: number }[]) ?? []) {
        rows.push({ label: k.name, value: `${k.obtained} / ${k.maximum}` });
      }
    } else if (slug === 'mangal-dosha') {
      rows.push({ label: 'Mangal Dosha', value: r.present ? 'Present' : 'Not present' });
      if (r.severity) rows.push({ label: 'Type', value: String(r.severity) });
    } else {
      if (r.moonSign) rows.push({ label: 'Moon sign (Rashi)', value: String(r.moonSign) });
      if (r.sunSign) rows.push({ label: 'Sun sign', value: String(r.sunSign) });
      const asc = r.ascendant as { sign?: string } | null;
      if (asc?.sign) rows.push({ label: 'Ascendant (Lagna)', value: asc.sign });
      const nak = r.nakshatra as { name?: string; pada?: number | null } | null;
      if (nak?.name) {
        rows.push({ label: 'Nakshatra', value: nak.pada ? `${nak.name}, pada ${nak.pada}` : nak.name });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">
          Your result
        </h2>

        {rows.length > 0 ? (
          <dl className="mt-6 divide-y divide-[var(--color-hairline)]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-sm text-[var(--color-body-warm)]">{row.label}</dt>
                <dd className="font-medium text-[var(--color-cocoa)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          // Honest empty state rather than a spinner that never resolves or a
          // fabricated answer. The provider returned something we could not
          // read, and saying so is better than inventing a result.
          <p className="mt-4 text-sm text-[var(--color-body-warm)]">
            The calculation completed but returned nothing we could display. Please try again, or
            book a consultation and Komal will read the chart properly.
          </p>
        )}

        <p className="mt-8 border-t border-[var(--color-hairline)] pt-6 text-sm leading-relaxed text-[var(--color-body-warm)]">
          This is a computed summary, not a reading. What the placements <em>mean</em> for your
          situation is what a consultation is for.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button asChild size="lg" variant="primary">
          <a href="/book">Book a consultation</a>
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Run it again
        </Button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Numerology — no network, no email gate                                    */
/* ========================================================================== */

function NumerologyTool({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [partner, setPartner] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const needsDate = slug === 'numerology' || slug === 'lo-shu-grid';
  const needsName = slug !== 'lo-shu-grid';
  const isFlames = slug === 'flames';

  const core = date ? coreNumbers(date, name) : null;
  const grid = date ? loShuGrid(date) : null;
  const nameOnly = name ? nameNumber(name) : null;
  const flamesResult = isFlames && name && partner ? flames(name, partner) : null;

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="space-y-6"
      >
        {needsName && (
          <Field label={isFlames ? 'Your name' : 'Full name'} htmlFor="num-name" required>
            <Input id="num-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        )}
        {isFlames && (
          <Field label="Their name" htmlFor="num-partner" required>
            <Input
              id="num-partner"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              required
            />
          </Field>
        )}
        {needsDate && (
          <Field label="Date of birth" htmlFor="num-date" required>
            <Input
              id="num-date"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
        )}

        <Button type="submit" size="lg" variant="primary" className="w-full md:w-auto">
          Calculate
        </Button>
      </form>

      {submitted && (
        <div className="border-t border-[var(--color-hairline)] pt-8">
          {slug === 'numerology' && core && (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Psychic (Mulank)', value: core.psychic },
                { label: 'Destiny (Bhagyank)', value: core.destiny },
                { label: 'Name number', value: core.name },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-[var(--color-hairline)] bg-[var(--color-cream)] p-5 text-center"
                >
                  <div className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-cocoa)]">
                    {item.value ?? '—'}
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-saffron-deep)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {slug === 'name-number' && nameOnly && (
            <p className="text-center font-[family-name:var(--font-display)] text-5xl text-[var(--color-cocoa)]">
              {nameOnly.reduced}
              <span className="mt-3 block text-sm font-normal tracking-wide text-[var(--color-body-warm)]">
                Chaldean total {nameOnly.total}
              </span>
            </p>
          )}

          {slug === 'lo-shu-grid' && grid && (
            <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-1">
              {grid.rows.flat().map((cell) => (
                <div
                  key={cell.digit}
                  className="flex aspect-square flex-col items-center justify-center border border-[var(--color-hairline)] bg-[var(--color-cream)]"
                >
                  <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">
                    {cell.count > 0 ? String(cell.digit).repeat(cell.count) : '—'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-body-warm)] opacity-60">
                    {cell.digit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isFlames && (
            <p className="text-center">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-cocoa)]">
                {flamesResult ?? '—'}
              </span>
              {/* Said plainly rather than buried in small print: this one is a
                  playground game and presenting it as astrology would be a lie. */}
              <span className="mt-4 block text-sm text-[var(--color-body-warm)]">
                FLAMES is a playground game, not astrology. It is here for fun.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
