'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { Reveal } from '@/components/common/Reveal';
import type { Service } from '@/types/database';

export function CompactServiceRail({ services }: { services: Service[] }) {
  const [active, setActive] = React.useState(0);
  const current = services[active] ?? services[0];

  return (
    <div className="grid min-h-[410px] grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] lg:gap-8">
      <div className="flex flex-col gap-2 border-b border-[var(--color-hairline)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
        {services.map((service, index) => (
          <button
            key={service.id}
            type="button"
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className={`group flex items-center justify-between border px-5 py-4 text-left transition-colors duration-300 ${active === index ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-[var(--color-cream)]' : 'border-[var(--color-hairline)] bg-[var(--color-card-cream)] text-[var(--color-cocoa)] hover:bg-white'}`}
          >
            <span>
              <span className="label-small block opacity-70">{String(index + 1).padStart(2, '0')}</span>
              <span className="mt-1 block font-[family-name:var(--font-display)] text-xl font-medium">{service.title}</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </button>
        ))}
      </div>

      <Reveal key={current.id} className="relative flex flex-col justify-between border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-10 before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)]">
        <div className="relative z-10">
          <p className="label-caps mt-8 text-[var(--color-saffron-deep)]">Private consultation</p>
          <h3 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--color-cocoa)]">{current.title}</h3>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-body-warm)]">{current.tagline ?? current.description}</p>
        </div>
        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-[var(--color-hairline)] pt-6">
          <div className="flex items-center gap-6 text-sm text-[var(--color-body-warm)]">
            <span className="flex items-center gap-2"><Clock className="size-4 text-[var(--color-saffron-deep)]" aria-hidden /> {current.duration_minutes} min</span>
            <span className="tabular">{formatPaise(current.price_paise)}</span>
          </div>
          <Link href={`/services/${current.slug}`} className="label-caps inline-flex items-center gap-2 border border-[var(--color-terracotta)] px-5 py-3 text-[var(--color-terracotta)] transition-colors hover:bg-[var(--color-terracotta)] hover:text-white">View service <ArrowUpRight className="size-4" aria-hidden /></Link>
        </div>
      </Reveal>
    </div>
  );
}
