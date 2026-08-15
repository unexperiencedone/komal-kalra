import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, MapPin, Phone as PhoneIcon, Video } from 'lucide-react';
import { getServiceBySlug } from '@/lib/booking/availability';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPaise, paiseToRupees } from '@/lib/money';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BOOKING_FAQ } from '@/lib/content/faq';
import { img, serviceImage } from '@/lib/content/imagery';
import { serviceContextImage, serviceJourney, serviceLogistics } from '@/lib/content/service-journeys';

/**
 * Service detail — built to the `service_detail_healing` design.
 *
 * Layout, in order:
 *   1. Hero        5/7 split, text left, photograph right with an OFFSET gold
 *                  frame (translated 16px down-right behind the image)
 *   2. Divider     a single gold hairline
 *   3. Journey     three numbered phases, square photographs, hover zoom
 *   4. Bento       8-col pricing card + 4-col stack (Location / Preparation),
 *                  the second of which is an inverted navy card
 *   5. FAQ         4/8 split — heading left, accordion right
 *
 * Everything that is a number or a fact — price, duration, mode, cancellation
 * window — is read from the DATABASE, not from the design file. The design's
 * "$300 / 60 mins" is a mock; a marketing page that hardcodes a price will
 * eventually contradict what the checkout charges.
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
  const contextKey = serviceContextImage(service.slug);
  const context = contextKey ? img(contextKey) : null;
  const journey = serviceJourney(service.slug);
  const logistics = serviceLogistics(service.mode);
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

  const bookHref = service.bookable_online ? `/book?service=${service.slug}` : '/contact';
  const bookLabel = service.bookable_online ? 'Begin Your Journey' : 'Enquire About This Service';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pb-[var(--spacing-section-lg)] pt-8 md:pt-16">
        {/* ============================ 1. HERO ============================ */}
        <section className="shell mb-[var(--spacing-section-lg)]">
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="label-small flex items-center gap-2 text-[var(--color-on-surface-variant)]">
              <li><Link href="/" className="transition-colors hover:text-[var(--color-cosmic-navy)]">Home</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/services" className="transition-colors hover:text-[var(--color-cosmic-navy)]">Services</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-[var(--color-cosmic-navy)]">{service.title}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <Reveal className="relative z-10 md:col-span-5">
              <p className="label-caps text-[var(--color-gold-deep)]">{service.title}</p>

              <h1 className="mt-4 text-[length:var(--text-display-lg)]">
                {service.tagline ?? service.title}
              </h1>

              <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
                {service.description.split('\n')[0]}
              </p>

              <div className="mt-10">
                <Button asChild size="lg">
                  <Link href={bookHref}>
                    {bookLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-7">
              {/* The offset gold frame — a 1px rule translated 16px down and
                  right, sitting behind the photograph. This one detail does
                  most of the work of making the page feel considered. */}
              <div className="relative aspect-[4/5] w-full bg-[var(--color-linen-grey)] md:aspect-[3/2]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  priority
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover contrast-[1.1] grayscale-[20%]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 translate-x-4 translate-y-4 border border-[color-mix(in_srgb,var(--color-muted-gold)_30%,transparent)]"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========================== 2. DIVIDER =========================== */}
        <div className="shell">
          <div
            aria-hidden
            className="mb-[var(--spacing-section-lg)] h-px w-full bg-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)]"
          />
        </div>

        {/* ========================== 3. JOURNEY =========================== */}
        {journey && (
          <section aria-labelledby="journey-heading" className="shell mb-[var(--spacing-section-lg)]">
            <Reveal>
              <div className="mx-auto mb-16 max-w-2xl text-center">
                <h2 id="journey-heading" className="text-[length:var(--text-h2)]">
                  {journey.heading}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                  {journey.intro}
                </p>
              </div>
            </Reveal>

            <ol className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {journey.phases.map((phase, i) => {
                const photo = phase.image ? img(phase.image) : null;
                return (
                  <Reveal as="li" key={phase.title} delay={(i + 1) * 100} className="flex flex-col">
                    <p className="label-caps tabular text-[var(--color-gold-deep)]">
                      {String(i + 1).padStart(2, '0')}
                    </p>

                    {photo ? (
                      <div className="group relative mt-4 aspect-square overflow-hidden bg-[var(--color-linen-grey)]">
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="(min-width: 768px) 30vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      /* No commissioned photograph for this phase — a tonal
                         panel with the numeral rather than another service's
                         imagery, which would misrepresent the session. */
                      <div
                        aria-hidden
                        className="mt-4 flex aspect-square items-center justify-center border border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] bg-[var(--color-surface-low)]"
                      >
                        <span className="font-[family-name:var(--font-display)] text-6xl text-[color-mix(in_srgb,var(--color-muted-gold)_35%,transparent)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-medium">
                      {phase.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                      {phase.body}
                    </p>
                  </Reveal>
                );
              })}
            </ol>
          </section>
        )}

        {/* ===================== 4. INVESTMENT (BENTO) ===================== */}
        <section aria-labelledby="pricing-heading" className="shell mb-[var(--spacing-section-lg)]">
          <Reveal>
            {/* gap-1 rather than a larger gutter: the design butts these panels
                almost flush, so the seams read as structural rules. */}
            <div className="grid grid-cols-1 gap-1 md:grid-cols-12">
              {/* ---- Main pricing card ---- */}
              <div className="relative overflow-hidden bg-[var(--color-surface-low)] p-10 md:col-span-8 md:p-16">
                <div className="relative z-10">
                  <h2 id="pricing-heading" className="text-[length:var(--text-h2)]">
                    Session Investment
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                    A {service.duration_minutes}-minute one-to-one consultation, tailored entirely
                    to what you bring to it.
                  </p>

                  <p className="mt-8 flex items-baseline gap-2">
                    <span className="tabular font-[family-name:var(--font-display)] text-[length:var(--text-display-lg)] font-semibold text-[var(--color-cosmic-navy)]">
                      {formatPaise(service.price_paise)}
                    </span>
                    <span className="text-base text-[var(--color-on-surface-variant)]">
                      / {service.duration_minutes} mins
                    </span>
                  </p>

                  {service.highlights.length > 0 && (
                    <ul className="mt-8 space-y-4">
                      {service.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-3 text-[var(--color-on-surface-variant)]">
                          <CheckCircle2 className="size-4 shrink-0 text-[var(--color-muted-gold)]" aria-hidden />
                          <span className="text-base">{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-10">
                    <Button asChild size="lg" variant="secondary">
                      <Link href={bookHref}>
                        {service.bookable_online ? 'Reserve Your Time' : 'Enquire'}
                      </Link>
                    </Button>
                  </div>

                  <p className="mt-6 text-sm text-[var(--color-on-surface-variant)]">
                    Free cancellation up to {cancellationHours} hours before your session.
                  </p>
                </div>

                {/* Decorative gold ring, bleeding off the bottom-right corner. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full border border-[color-mix(in_srgb,var(--color-muted-gold)_12%,transparent)]"
                />
              </div>

              {/* ---- Secondary info stack ---- */}
              <div className="flex flex-col gap-1 md:col-span-4">
                <div className="flex flex-grow flex-col justify-center bg-[var(--color-linen-grey)] p-10">
                  <mode.icon className="size-7 text-[var(--color-muted-gold)]" aria-hidden />
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium">
                    Location
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                    {logistics.location}
                  </p>
                </div>

                {/* The single inverted card on this page. */}
                <div className="band-ink flex flex-grow flex-col justify-center p-10">
                  <Clock className="size-7 text-[var(--color-gold-light)]" aria-hidden />
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-warm-ivory)]">
                    Preparation
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--color-on-primary-container)]">
                    {logistics.preparation}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ==================== 5. WHAT THIS COVERS ======================== */}
        <section aria-labelledby="covers-heading" className="shell mb-[var(--spacing-section-lg)]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <h2 id="covers-heading" className="text-[length:var(--text-h2)]">
                What this session covers
              </h2>
              <span className="gold-rule mt-6" aria-hidden />

              {/*
                Editorial still-life anchoring the context column.

                Only rendered for services where it is truthful — the journal of
                astronomical notation belongs to chart work, and would
                misrepresent a counselling or healing session. See
                serviceContextImage() for the mapping. Where there is none the
                column is heading and rule alone, which reads fine.

                Placed in the short column rather than beside the body copy
                because that column was otherwise a heading against a tall block
                of text; the image gives it enough weight for the two to balance.
                4/5 crop with the same gold hairline as the About still, so the
                editorial images read as a set.
              */}
              {context && (
                <Image
                  src={context.src}
                  alt={context.alt}
                  width={1024}
                  height={1024}
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="mt-10 hidden aspect-[4/5] w-full border border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] object-cover md:block"
                />
              )}
            </Reveal>

            <Reveal delay={100} className="md:col-span-8">
              <p className="whitespace-pre-line text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                {service.description}
              </p>

              {service.ideal_for.length > 0 && (
                <div className="mt-10 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
                  <p className="label-caps text-[var(--color-gold-deep)]">Suited to</p>
                  <ul className="mt-6 grid gap-6 sm:grid-cols-3">
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
              )}
            </Reveal>
          </div>
        </section>

        {/* ============================= 6. FAQ ============================ */}
        <section aria-labelledby="faq-heading" className="shell">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <h2 id="faq-heading" className="text-[length:var(--text-h2)]">Expectations</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                Clarity on the process, so you feel secure and prepared.
              </p>
            </Reveal>

            <Reveal delay={100} className="md:col-span-8">
              <FaqAccordion items={BOOKING_FAQ.slice(0, 5)} />
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}
