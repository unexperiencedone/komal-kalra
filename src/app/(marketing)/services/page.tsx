import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveServices } from '@/lib/booking/availability';
import { ServiceCircle } from '@/components/marketing/ServiceCircle';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/card';
import { BRAND } from '@/lib/config';
import { img } from '@/lib/content/imagery';

export const metadata: Metadata = {
  title: 'Consultation Services',
  description:
    'Astrological guidance, Kundli Milan, life coaching, healing and counselling with Komal Kalra. Fixed fees, clear durations, booked online.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();
  const introImage = img('templeBellsBanner');

  return (
    <>
      <section className="band-terracotta relative overflow-hidden py-[var(--spacing-section-md)]">
        <Image
          src={introImage.src}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-0 object-cover opacity-100"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, transparent 36%, black 82%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 36%, black 82%, black 100%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-terracotta)]/75" />
        <div className="shell relative z-10">
          <Reveal>
            <p className="label-caps text-[var(--color-cream)]">The Practice</p>
            <div className="inline-block text-left">
              <h1 className="mt-4 max-w-3xl text-[length:var(--text-h1)]">Consultation Services</h1>
              <span className="gold-rule mt-6 !w-[calc(100%+1rem)] max-w-none bg-[var(--color-saffron-lift)]" aria-hidden />
            </div>
            <p className="standfirst mt-6 text-[var(--color-cream)]">
              Every session is one-to-one and confidential. Fees and durations are shown
              upfront — nothing is added at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band-cream py-[var(--spacing-section-lg)]">
        <div className="shell">
          <ServiceCircle services={services} />

          <Reveal delay={120}>
            <div className="band-navy mt-16 p-10 text-center sm:p-16">
              <SectionHeading
                eyebrow="Not sure which"
                title="Describe what is going on"
                onDark
                className="mx-auto text-center [&_.gold-rule]:mx-auto [&_.gold-rule]:!w-[calc(100%+1rem)] [&_.gold-rule]:!max-w-none"
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
                  className="label-caps border-b border-[var(--color-saffron-lift)] pb-1 text-[var(--color-saffron-lift)] transition-opacity hover:opacity-80"
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
