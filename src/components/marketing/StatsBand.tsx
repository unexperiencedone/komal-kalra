'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Stats band.
 *
 * THE HONEST VERSION of the reference site's counter band.
 *
 * astroarunpandit.org renders `0M+ / 0.0M+ / 0Lakh+ / 0+` on load — the
 * placeholder values leak through before the animation runs, which tells you
 * the numbers are decorative rather than derived. That is precisely the failure
 * this component is built to avoid.
 *
 * Every figure here comes from a COUNT over real rows:
 *   consultations  appointments with status = 'completed'
 *   clients        distinct users with at least one completed appointment
 *   rating         mean of approved testimonials
 *
 * And it renders NOTHING until there is enough real data to be credible
 * (see MIN_CONSULTATIONS). An empty section is honest; an invented one destroys
 * the trust the rest of the design is working to build.
 *
 * There is deliberately no prop for a hardcoded number. You cannot fake this
 * component without editing it.
 */

/** Below this, the band stays hidden — a proud "3 consultations" reads worse than silence. */
const MIN_CONSULTATIONS = 25;

export interface RealStats {
  consultations: number;
  clients: number;
  averageRating: number;
  reviewCount: number;
}

function useCountUp(target: number, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || done.current) return;

    // Respect reduced motion: jump straight to the value rather than animating.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      done.current = true;
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done.current) return;
      done.current = true;
      observer.disconnect();

      const duration = 900;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutQuint — fast then settling, matching the motion system.
        const eased = 1 - Math.pow(1 - t, 5);
        setValue(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return {
    ref,
    display: decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-IN'),
  };
}

function Stat({ target, decimals = 0, suffix = '', label }: {
  target: number; decimals?: number; suffix?: string; label: string;
}) {
  const { ref, display } = useCountUp(target, decimals);
  return (
    <div className="text-center">
      {/* The accessible name carries the final value, so a screen reader is not
          read a stream of intermediate animation frames. */}
      <p
        className="tabular font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl"
        aria-label={`${decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('en-IN')}${suffix} ${label}`}
      >
        <span ref={ref} aria-hidden>{display}</span>
        <span aria-hidden>{suffix}</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-stone)]">{label}</p>
    </div>
  );
}

export function StatsBand({ stats }: { stats: RealStats }) {
  // The honesty gate. Not a loading state — a permanent "not yet" state.
  if (stats.consultations < MIN_CONSULTATIONS) return null;

  return (
    <section
      aria-labelledby="stats-heading"
      className="constellation-motif border-y border-[var(--color-linen)] bg-white py-14"
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <h2 id="stats-heading" className="sr-only">Consultations delivered</h2>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <Stat target={stats.consultations} suffix="+" label="Consultations completed" />
          <Stat target={stats.clients} suffix="+" label="People guided" />
          {stats.reviewCount > 0 && (
            <>
              <Stat target={stats.averageRating} decimals={1} label="Average rating out of 5" />
              <Stat target={stats.reviewCount} suffix="+" label="Reviews from clients" />
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--color-stone)]">
          Counted from completed bookings on this site. Nothing here is estimated.
        </p>
      </div>
    </section>
  );
}
