import { notFound } from 'next/navigation';
import { CalculatorForm } from '@/components/tools/CalculatorForm';
import { Reveal } from '@/components/common/Reveal';

const TOOLS: Record<string, { title: string; description: string }> = {
  'free-kundli': {
    title: 'Free Kundli Calculator',
    description: 'Generate your Vedic birth chart and understand the planetary pattern at your exact moment of birth.',
  },
  'panchang': {
    title: 'Daily Panchang',
    description: 'Check Tithi, Nakshatra, Yoga, Karana and auspicious timings for today.',
  },
  'moon-sign': {
    title: 'Moon Sign Calculator',
    description: 'Discover your Rashi and the emotional patterns associated with your Moon placement.',
  },
  'lagna': {
    title: 'Lagna Calculator',
    description: 'Find your ascendant and learn how it shapes the way you approach life.',
  },
  'nakshatra': {
    title: 'Nakshatra Calculator',
    description: 'Identify your lunar mansion and explore the qualities it brings to your chart.',
  },
  'rahu-ketu': {
    title: 'Rahu-Ketu Calculator',
    description: 'Explore the karmic axis formed by Rahu and Ketu in your birth chart.',
  },
  numerology: {
    title: 'Vedic Numerology Calculator',
    description: 'Calculate your psychic, destiny and name numbers from your birth details.',
  },
  'name-number': {
    title: 'Name Number Calculator',
    description: 'Decode the numerological vibration carried by your name.',
  },
  'lo-shu-grid': {
    title: 'Lo Shu Grid Calculator',
    description: 'Map the numbers in your birth date to reveal recurring strengths and gaps.',
  },
  flames: {
    title: 'FLAMES Compatibility',
    description: 'A playful name-based compatibility exercise for two people.',
  },
  'mangal-dosha': {
    title: 'Mangal Dosha Calculator',
    description: 'Enter your birth details to generate an accurate Mangal Dosha (Kuja Dosha) analysis based on Vedic principles.',
  },
  'kaal-sarp': {
    title: 'Kaal Sarp Dosha Calculator',
    description: 'Determine the presence and specific type of Kaal Sarp Yoga in your natal chart.',
  },
  'sade-sati': {
    title: 'Sade Sati Calculator',
    description: 'Calculate the exact phases of Saturn\'s transit across your natal Moon.',
  },
  'kundli-matching': {
    title: 'Kundli Matching (Ashtakoot Milan)',
    description: 'Enter the birth details of both partners to evaluate the 36 Gunas for marriage compatibility.',
  },
};

export function generateStaticParams() {
  return Object.keys(TOOLS).map((tool) => ({ tool }));
}

export default async function ToolPage(props: { params: Promise<{ tool: string }> }) {
  const { tool } = await props.params;
  const config = TOOLS[tool];
  
  if (!config) notFound();

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[var(--color-cream)] pb-[var(--spacing-section-lg)]">
      <section className="band-terracotta border-b border-[var(--color-hairline)] py-12 md:py-16">
        <div className="shell">
          <Reveal>
            <p className="label-caps text-[var(--color-saffron-lift)]">Free Vedic Tool</p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl text-white md:text-6xl">{config.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-cream)]">{config.description}</p>
          </Reveal>
        </div>
      </section>
      <div className="shell max-w-4xl py-12 md:py-16">
        <Reveal>
          <div className="relative bg-[var(--color-card-cream)] p-8 before:pointer-events-none before:absolute before:inset-[4px] before:z-10 before:border before:border-[var(--color-hairline)] md:p-12">
            <div className="relative z-20">
              <CalculatorForm toolSlug={tool} />
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
