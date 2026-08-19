'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calculator, Heart, Sun } from 'lucide-react';
import { CalculatorForm } from '@/components/tools/CalculatorForm';
import { SectionWatermark } from '@/components/marketing/SectionWatermark';

const TOOLS = [
  { slug: 'free-kundli', title: 'Free Kundli', description: 'See the planetary pattern at your birth.', Icon: Sun },
  { slug: 'kundli-matching', title: 'Kundli Matching', description: 'Explore compatibility through Guna Milan.', Icon: Heart },
  { slug: 'panchang', title: 'Panchang', description: 'Check today’s Tithi and auspicious timings.', Icon: Calculator },
];

export function ToolsLeadSection() {
  const [active, setActive] = useState(TOOLS[0].slug);
  const current = TOOLS.find((tool) => tool.slug === active) ?? TOOLS[0];

  return (
    <section aria-labelledby="tools-heading" className="band-sand relative isolate overflow-hidden py-[var(--spacing-section-lg)]">
      <SectionWatermark corner="top-right" />
      <SectionWatermark corner="bottom-left" />
      <div className="shell">
        <div className="mb-12 max-w-2xl">
          <p className="label-caps text-[var(--color-saffron-deep)]">Free Vedic tools</p>
          <h2 id="tools-heading" className="mt-4 font-[family-name:var(--font-display)] text-[length:var(--text-h2)] text-[var(--color-cocoa)]">Start with a little clarity</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-body-warm)]">Choose a tool, enter your details, and take the first step before you book a private consultation.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
          <div className="flex flex-col gap-3">
            {TOOLS.map(({ slug, title, description, Icon }) => (
              <button key={slug} type="button" onClick={() => setActive(slug)} className={`group flex items-center gap-4 border p-5 text-left transition-colors ${active === slug ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-[var(--color-cream)]' : 'border-[var(--color-hairline)] bg-[var(--color-card-cream)] text-[var(--color-cocoa)] hover:bg-white'}`}>
                <Icon className="size-6 shrink-0 text-[var(--color-saffron)] group-[.bg-\[var\(--color-terracotta\)\]]:text-[var(--color-saffron-lift)]" aria-hidden />
                <span><span className="block font-[family-name:var(--font-display)] text-xl">{title}</span><span className="mt-1 block text-sm opacity-80">{description}</span></span>
              </button>
            ))}
            <Link href="/free-tools" className="label-caps mt-3 inline-flex items-center gap-2 text-[var(--color-terracotta)]">View all tools <ArrowUpRight className="size-4" aria-hidden /></Link>
          </div>
          <div className="relative border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] md:p-10">
            <div className="relative z-10"><p className="label-caps text-[var(--color-saffron-deep)]">{current.title}</p><h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">Calculate for free</h3><div className="mt-6"><CalculatorForm toolSlug={current.slug} /></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
