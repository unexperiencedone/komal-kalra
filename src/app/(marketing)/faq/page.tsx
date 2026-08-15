import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BOOKING_FAQ } from '@/lib/content/faq';
import { Reveal } from '@/components/common/Reveal';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'Booking, payment, cancellation and consultation questions answered — including what to do if you do not know your exact birth time.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BOOKING_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="band-low border-b border-[color-mix(in srgb, var(--color-muted-gold) 20%, transparent)] py-16 sm:py-20">
        <div className="shell max-w-3xl">
          <Reveal>
            <h1 className="text-[length:var(--text-h1)]">Questions, answered</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-[var(--color-on-surface-variant)]">
              Everything about booking, payment and cancellation. If your question is not
              here, call {BRAND.phones[0]} and ask.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band-low py-16 sm:py-20">
        <div className="shell max-w-3xl">
          <FaqAccordion items={BOOKING_FAQ} />

          <div className="band-navy mt-14  border border-[var(--color-outline)]/25 p-8 text-center">
            <h2 className="text-[length:var(--text-h3)]">Still not sure?</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-on-surface-variant)]">
              Ask before you book. Komal reads every enquiry personally.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="onDark"><Link href="/contact">Send a message</Link></Button>
              <Button asChild><Link href="/book">Book a consultation</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
