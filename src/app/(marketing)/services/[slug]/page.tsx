import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check, Clock, MapPin, Phone as PhoneIcon, Video } from 'lucide-react';
import { getServiceBySlug } from '@/lib/booking/availability';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPaise, paiseToRupees } from '@/lib/money';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BOOKING_FAQ } from '@/lib/content/faq';
import { serviceImage } from '@/lib/content/imagery';

/**
 * Service detail — built to the `service_detail_*` designs.
 *
 * Editorial two-column: full-bleed photograph on one side, sticky booking
 * panel on the other. These pages carry Service + Offer structured data with
 * the REAL price from the database, so a rich result can never advertise a
 * figure the checkout does not charge.
 */

export async function generateStaticParams() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('services').select('slug').eq('active', true);
    return (data ?? []).map((s) => ({ slug: s.slug as string }));
  } catch {
    // No database at build time (CI without secrets): render on demand rather
    // than failing the build.
    return [];
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: 'Service not found' };

  return {
    title: service.seo_title ?? service.title,
    description: service.seo_description ?? service.tagline ?? service.description.slice(0, 155),
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.seo_title ?? service.title,
      description: service.seo_description ?? service.tagline ?? undefined,
      url: `/services/${service.slug}`,
    },
  };
}

const MODE = {
  video: { icon: Video, label: 'Video consultation' },
  phone: { icon: PhoneIcon, label: 'Telephone consultation' },
  in_person: { icon: MapPin, label: 'In person' },
} as const;

export default async function ServiceDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const mode = MODE[service.mode];
  const photo = serviceImage(service.slug);
  const cancellationHours = service.free_cancellation_hours ?? POLICY.freeCancellationHours;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: { '@type': 'Person', name: BRAND.fullName },
    areaServed: 'IN',
    serviceType: service.title,
    offers: {
      '@type': 'Offer',
      price: paiseToRupees(service.price_paise).toFixed(2),
      priceCurrency: service.currency,
      availability: service.bookable_online
        ? 'https://schema.org/InStock'
        : 'https://schema.org/LimitedAvailability',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/book?service=${service.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        {/* ---------------------------- HERO ---------------------------- */}
        <section className="band-low border-b border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)]">
          <div className="shell grid grid-cols-1 items-stretch gap-0 md:grid-cols-12">
            <div className="py-[var(--spacing-section-md)] md:col-span-6 md:pr-16">
              <nav aria-label="Breadcrumb" className="mb-8">
                <ol className="label-small flex items-center gap-2 text-[var(--color-on-surface-variant)]">
                  <li><Link href="/" className="hover:text-[var(--color-cosmic-navy)]">Home</Link></li>
                  <li aria-hidden>/</li>
                  <li><Link href="/services" className="hover:text-[var(--color-cosmic-navy)]">Services</Link></li>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="text-[var(--color-cosmic-navy)]">{service.title}</li>
                </ol>
              </nav>

              <Reveal>
                <p className="label-caps text-[var(--color-gold-deep)]">Consultation</p>
                <h1 className="mt-4 text-[length:var(--text-h1)]">{service.title}</h1>
                <span className="gold-rule mt-6" aria-hidden />
                {service.tagline && (
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
                    {service.tagline}
                  </p>
                )}

                <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
                  <div>
                    <dt className="label-caps text-[var(--color-on-surface-variant)]">Duration</dt>
                    <dd className="mt-2 flex items-center gap-2 text-[var(--color-cosmic-navy)]">
                      <Clock className="size-4 text-[var(--color-muted-gold)]" aria-hidden />
                      {service.duration_minutes} minutes
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-[var(--color-on-surface-variant)]">Format</dt>
                    <dd className="mt-2 flex items-center gap-2 text-[var(--color-cosmic-navy)]">
                      <mode.icon className="size-4 text-[var(--color-muted-gold)]" aria-hidden />
                      {mode.label}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-[var(--color-on-surface-variant)]">Session fee</dt>
                    <dd className="tabular mt-2 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cosmic-navy)]">
                      {formatPaise(service.price_paise)}
                    </dd>
                  </div>
                </dl>
              </Reveal>
            </div>

            <div className="relative min-h-[320px] md:col-span-6 md:min-h-[620px]">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* --------------------------- CONTENT --------------------------- */}
        <section className="band-ivory py-[var(--spacing-section-lg)]">
          <div className="shell grid grid-cols-1 gap-16 md:grid-cols-12">
            <Reveal className="md:col-span-7">
              <h2 className="text-[length:var(--text-h2)]">What this session covers</h2>
              <span className="gold-rule mt-6" aria-hidden />
              <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                {service.description}
              </p>

              {service.highlights.length > 0 && (
                <ul className="mt-10 space-y-4 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
                  {service.highlights.map((h) => (
                    <li key={h} className="flex gap-4 text-base leading-relaxed text-[var(--color-on-surface)]">
                      <Check className="mt-1 size-4 shrink-0 text-[var(--color-muted-gold)]" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>

            {/* Sticky booking panel */}
            <Reveal delay={100} className="md:col-span-5">
              <div className="border border-[color-mix(in_srgb,var(--color-muted-gold)_25%,transparent)] bg-[var(--color-linen-grey)] p-8 md:sticky md:top-28">
                <p className="label-caps text-[var(--color-on-surface-variant)]">Session fee</p>
                <p className="tabular mt-2 font-[family-name:var(--font-display)] text-4xl font-medium text-[var(--color-cosmic-navy)]">
                  {formatPaise(service.price_paise)}
                </p>
                <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                  for a {service.duration_minutes}-minute consultation
                </p>

                {service.bookable_online ? (
                  <Button asChild size="lg" full className="mt-8">
                    <Link href={`/book?service=${service.slug}`}>Check Available Times</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" full className="mt-8">
                    <Link href="/contact">Enquire About This Service</Link>
                  </Button>
                )}

                <Button asChild variant="secondary" full className="mt-3">
                  <a href={`tel:${BRAND.phonesE164[0]}`}>Call {BRAND.phones[0]}</a>
                </Button>

                <ul className="mt-8 space-y-3 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-6 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                  <li>Free cancellation up to {cancellationHours} hours before your session.</li>
                  <li>Secure payment by UPI, card or netbanking.</li>
                  <li>Bookable up to {service.max_advance_days} days ahead.</li>
                </ul>
              </div>
            </Reveal>
          </div>

          {service.ideal_for.length > 0 && (
            <div className="shell mt-20">
              <Reveal>
                <div className="border border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] bg-[var(--color-surface-low)] p-8 sm:p-12">
                  <p className="label-caps text-[var(--color-gold-deep)]">Suited to</p>
                  <ul className="mt-8 grid gap-6 md:grid-cols-3">
                    {service.ideal_for.map((item, i) => (
                      <li key={item}>
                        <span className="label-small tabular block text-[var(--color-muted-gold)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="mt-3 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          )}
        </section>

        <section aria-labelledby="service-faq" className="band-low border-t border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-md)]">
          <div className="shell max-w-3xl">
            <h2 id="service-faq" className="text-[length:var(--text-h2)]">Common questions</h2>
            <span className="gold-rule mt-6" aria-hidden />
            <div className="mt-10">
              <FaqAccordion items={BOOKING_FAQ.slice(0, 5)} />
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
