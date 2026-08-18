'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { CompactServiceRail } from './CompactServiceRail';
import type { Service } from '@/types/database';

export function ServiceCircle({ services }: { services: Service[] }) {
  const [active, setActive] = React.useState(0);
  const current = services[active] ?? services[0];

  return (
    <>
      <div className="relative mx-auto hidden aspect-square w-full max-w-[780px] lg:block">
        <div className="absolute inset-[14%] rounded-full border border-[var(--color-hairline)] opacity-70" />
        <div className="absolute inset-[25%] rounded-full border border-dashed border-[var(--color-hairline)] opacity-70" />
        <div className="absolute left-1/2 top-1/2 z-10 flex aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 text-center before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)]">
          <div className="relative z-10">
            <p className="label-caps text-[var(--color-saffron-deep)]">Selected service</p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-cocoa)]">{current.title}</h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-body-warm)]">{current.tagline ?? current.description}</p>
            <div className="mt-5 flex justify-center gap-4 text-xs text-[var(--color-body-warm)]"><span className="flex items-center gap-1"><Clock className="size-3.5 text-[var(--color-saffron-deep)]" aria-hidden />{current.duration_minutes} min</span><span>{formatPaise(current.price_paise)}</span></div>
            <Link href={`/services/${current.slug}`} className="label-caps mt-5 inline-flex items-center gap-2 border border-[var(--color-terracotta)] px-4 py-2 text-[var(--color-terracotta)] hover:bg-[var(--color-terracotta)] hover:text-white">View service <ArrowUpRight className="size-3.5" aria-hidden /></Link>
          </div>
        </div>
        {services.map((service, index) => {
          const angle = (index / services.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <button key={service.id} type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className={`absolute z-20 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border p-4 text-center transition-all duration-300 xl:size-40 ${active === index ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-[var(--color-cream)] scale-110' : 'border-[var(--color-hairline)] bg-[var(--color-cream)] text-[var(--color-cocoa)] hover:bg-[var(--color-card-cream)]'}`} style={{ left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` }}>
              <span className="label-small opacity-70">0{index + 1}</span>
              <span className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight">{service.title}</span>
            </button>
          );
        })}
      </div>
      <div className="lg:hidden"><CompactServiceRail services={services} /></div>
    </>
  );
}
