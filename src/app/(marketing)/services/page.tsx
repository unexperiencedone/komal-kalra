import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveServices } from '@/lib/booking/availability';
import { ServiceGrid } from '@/components/marketing/ServiceGrid';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/card';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Consultation Services',
  description:
    'Astrological guidance, Kundli Milan, life coaching, healing and counselling with Komal Kalra. Fixed fees, clear durations, booked online.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <>
      <section className="band-low border-b border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-md)]">
        <div className="shell">
          <Reveal>
            <p className="label-caps text-[var(--color-gold-deep)]">The Practice</p>
            <h1 className="mt-4 max-w-3xl text-[length:var(--text-h1)]">Consultation Services</h1>
            <span className="gold-rule mt-6" aria-hidden />
            <p className="standfirst mt-6">
              Every session is one-to-one and confidential. Fees and durations are shown
              upfront — nothing is added at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band-ivory py-[var(--spacing-section-lg)]">
        <div className="shell">
          <ServiceGrid services={services} />

          <Reveal delay={120}>
            <div className="band-navy mt-16 p-10 text-center sm:p-16">
              <SectionHeading
                eyebrow="Not sure which"
                title="Describe what is going on"
                onDark
                className="mx-auto text-center"
              />
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[var(--color-on-primary-container)]">
                If a consultation is not the right fit for what you need, Komal will say so.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="onDark">
                  <Link href="/book">Book a Consultation</Link>
                </Button>
                <a
                  href={`tel:${BRAND.phonesE164[0]}`}
                  className="label-caps border-b border-[var(--color-gold-light)] pb-1 text-[var(--color-gold-light)] transition-opacity hover:opacity-80"
                >
                  Call {BRAND.phones[0]}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
