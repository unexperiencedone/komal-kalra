import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Clock, MapPin, Phone as PhoneIcon, Video } from 'lucide-react';
import { getServiceBySlug } from '@/lib/booking/availability';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPaise, paiseToRupees } from '@/lib/money';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BOOKING_FAQ } from '@/lib/content/faq';

/**
 * Service detail page.
 *
 * These are the pages that should rank for transactional intent ("kundli milan
 * online consultation"), so each carries Service + Offer structured data with
 * the REAL price read from the database. A rich result therefore can never show
 * a price the site does not charge.
 */

/**
 * Pre-render one page per active service.
 *
 * Uses the service-role client, NOT getActiveServices(): the latter reads
 * cookies() to build a session-scoped client, and cookies() is not available
 * during generateStaticParams, which runs at build time with no request.
 */
export async function generateStaticParams() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('services').select('slug').eq('active', true);
    return (data ?? []).map((s) => ({ slug: s.slug as string }));
  } catch {
    // No database at build time (e.g. a CI build without secrets): fall back to
    // rendering these pages on demand rather than failing the build.
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
  video: { icon: Video, label: 'Video call' },
  phone: { icon: PhoneIcon, label: 'Phone call' },
  in_person: { icon: MapPin, label: 'In person' },
} as const;

export default async function ServiceDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const mode = MODE[service.mode];
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
      // Real price, straight from the database.
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
        <section className="band-dawn constellation-motif border-b border-[var(--color-linen)] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm">
              <ol className="flex items-center gap-2 text-[var(--color-stone)]">
                <li><Link href="/" className="hover:text-[var(--color-ember-text)]">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/services" className="hover:text-[var(--color-ember-text)]">Services</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-[var(--color-ink)]">{service.title}</li>
              </ol>
            </nav>

            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <Reveal>
                <h1 className="text-[length:var(--text-h1)]">{service.title}</h1>
                {service.tagline && (
                  <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[var(--color-bark)]">
                    {service.tagline}
                  </p>
                )}

                <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Duration</dt>
                    <Clock className="size-4 text-[var(--color-ember-text)]" aria-hidden />
                    <dd className="font-medium">{service.duration_minutes} minutes</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Format</dt>
                    <mode.icon className="size-4 text-[var(--color-ember-text)]" aria-hidden />
                    <dd className="font-medium">{mode.label}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Price</dt>
                    <dd className="tabular font-semibold">{formatPaise(service.price_paise)}</dd>
                  </div>
                </dl>
              </Reveal>

              {/* Booking card — sticky on desktop so the CTA is always reachable. */}
              <Reveal delay={80}>
                <div className="rounded-[var(--radius-card)] border border-[var(--color-linen)] border-t-4 border-t-[var(--color-ember)] bg-white p-6 shadow-[var(--shadow-lifted)] lg:sticky lg:top-24">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-stone)]">Price</p>
                  <p className="tabular mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
                    {formatPaise(service.price_paise)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-stone)]">
                    for a {service.duration_minutes}-minute session
                  </p>

                  {service.bookable_online ? (
                    <Button asChild size="lg" full className="mt-6">
                      <Link href={`/book?service=${service.slug}`}>
                        Check available times <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" full className="mt-6">
                      <Link href="/contact">Enquire about this service</Link>
                    </Button>
                  )}

                  <Button asChild variant="outline" full className="mt-2.5">
                    <a href={`tel:${BRAND.phonesE164[0]}`}>Call {BRAND.phones[0]}</a>
                  </Button>

                  <ul className="mt-6 space-y-2 border-t border-[var(--color-linen)] pt-5 text-xs leading-relaxed text-[var(--color-stone)]">
                    <li>Free cancellation up to {cancellationHours} hours before your session.</li>
                    <li>Secure payment by UPI, card or netbanking.</li>
                    <li>Bookable up to {service.max_advance_days} days ahead.</li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="band-sand py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr]">
              <Reveal>
                <h2 className="text-[length:var(--text-h3)]">What this session covers</h2>
                <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-[var(--color-bark)]">
                  {service.description}
                </p>

                {service.highlights.length > 0 && (
                  <ul className="mt-8 space-y-3">
                    {service.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-[15px] leading-relaxed text-[var(--color-bark)]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-jade)]" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>

              {service.ideal_for.length > 0 && (
                <Reveal delay={80}>
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-[var(--color-indigo-tint)] p-6">
                    <h2 className="font-sans text-[15px] font-semibold">This is probably right for you if…</h2>
                    <ul className="mt-4 space-y-3">
                      {service.ideal_for.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--color-bark)]">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-saffron)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="service-faq" className="band-cool border-t border-[var(--color-linen)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 lg:px-8">
            <h2 id="service-faq" className="text-[length:var(--text-h3)]">Common questions</h2>
            <div className="mt-6">
              <FaqAccordion items={BOOKING_FAQ.slice(0, 5)} />
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
