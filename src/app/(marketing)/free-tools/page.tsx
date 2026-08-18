import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Calculator } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { img } from '@/lib/content/imagery';

export const metadata: Metadata = {
  title: 'Free Astrological Calculators',
  description: 'Check your Mangal Dosha, Kaal Sarp Dosha, Sade Sati status, or match your Kundli instantly and for free.',
};

const TOOLS = [
  ['Free Kundli', 'free-kundli', 'Generate your birth chart and understand the planetary pattern at your birth.'],
  ['Kundli Matching', 'kundli-matching', 'Assess compatibility through the traditional Ashtakoot Milan system.'],
  ['Panchang', 'panchang', 'Check daily Tithi, Nakshatra, Yoga, Karana and auspicious timings.'],
  ['Moon Sign', 'moon-sign', 'Discover your emotional core and Rashi from the Moon placement.'],
  ['Lagna', 'lagna', 'Find your ascendant and the lens through which you meet the world.'],
  ['Nakshatra', 'nakshatra', 'Learn the lunar mansion that shapes your instincts and patterns.'],
  ['Rahu-Ketu', 'rahu-ketu', 'Explore the karmic axis represented by Rahu and Ketu in your chart.'],
  ['Numerology', 'numerology', 'Calculate your life path and destiny numbers.'],
  ['Name Number', 'name-number', 'Decode the numerological vibration carried by your name.'],
  ['Lo Shu Grid', 'lo-shu-grid', 'Map the numbers in your birth date to reveal recurring strengths.'],
  ['FLAMES', 'flames', 'A playful compatibility exercise for two names.'],
].map(([title, slug, description]) => ({ title, slug, description }));

export default function FreeToolsIndex() {
  const banner = img('panchangAlmanac');

  return (
    <div className="pb-[var(--spacing-section-lg)]">
      <section className="band-terracotta relative overflow-hidden border-b border-[var(--color-hairline)] py-12 md:py-16">
        <Image src={banner.src} alt="" aria-hidden fill sizes="100vw" className="pointer-events-none absolute inset-0 z-0 object-cover opacity-30" />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-terracotta)]/70" />
        <div className="shell relative z-10 text-center">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="label-caps text-[var(--color-saffron-lift)]">Free Vedic Tools</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white md:text-6xl">
              Calculators &amp; Insights
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-cream)]">
              Discover ancient wisdom structured for your modern life. Explore free tools for your cosmic blueprint.
            </p>
          </div>
        </Reveal>
        </div>
      </section>

      <section className="shell py-[var(--spacing-section-lg)]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.slug} delay={i * 100}>
              <Link
                href={`/free-tools/${tool.slug}`}
                className={`group relative flex h-full flex-col bg-[var(--color-card-cream)] p-6 transition-colors hover:bg-[var(--color-cream)] before:pointer-events-none before:absolute before:inset-[4px] before:z-10 before:border before:border-[var(--color-hairline)] ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className="relative z-20">
                  <Calculator className="size-8 text-[var(--color-saffron)] mb-6" strokeWidth={1.5} />
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cocoa)]">
                    {tool.title}
                  </h2>
                  <p className="mt-3 text-base text-[var(--color-body-warm)] leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="mt-8 flex items-center text-sm font-semibold uppercase tracking-widest text-[var(--color-terracotta)] group-hover:text-[var(--color-cocoa)] transition-colors">
                    Calculate Now
                    <ArrowRight className="ml-2 size-4" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
