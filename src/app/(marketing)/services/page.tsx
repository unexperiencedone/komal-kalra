import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getActiveServices } from '@/lib/booking/availability';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Consultations & Services',
  description:
    'Astrological guidance, Kundli Milan, life coaching, healing and counselling with Komal Kalra. Fixed prices, clear durations, booked online.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <>
      <section className="band-dawn constellation-motif border-b border-[var(--color-linen)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <h1 className="max-w-3xl text-[length:var(--text-h1)]">
              Consultations with Komal Kalra
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[var(--color-bark)]">
              Every session is one-to-one and confidential. Prices and durations are shown
              upfront, and nothing is added at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band-sand py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          {services.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <Reveal as="li" key={service.id} delay={i * 60}>
                  <ServiceCard service={service} featured={service.featured} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-linen)] p-12 text-center text-sm text-[var(--color-stone)]">
              Services will appear here once they have been added.
            </p>
          )}

          <Reveal delay={120}>
            <div className="band-night constellation-motif-dark on-dark mt-14 rounded-[var(--radius-panel)] border border-[var(--color-indigo-light)]/25 p-8 text-center shadow-[var(--shadow-lifted)] sm:p-10">
              <h2 className="text-[length:var(--text-h3)]">Not sure which one you need?</h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-bark)]">
                Call and describe what is going on. If a consultation is not the right fit,
                Komal will say so.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild><Link href="/book">Book a consultation <ArrowRight aria-hidden /></Link></Button>
                <Button asChild variant="outline" className="border-white/25 bg-transparent text-[var(--color-sand)] hover:border-white/45 hover:bg-white/10 hover:text-white">
                  <a href={`tel:${BRAND.phonesE164[0]}`}>Call {BRAND.phones[0]}</a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
