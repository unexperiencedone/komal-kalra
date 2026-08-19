import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, MapPin, Phone as PhoneIcon, Video } from 'lucide-react';
import { getServiceBySlug } from '@/lib/booking/availability';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { formatPaise, paiseToRupees } from '@/lib/money';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BOOKING_FAQ } from '@/lib/content/faq';
import { img, serviceImage } from '@/lib/content/imagery';
import { serviceContextImage } from '@/lib/content/service-journeys';
import { SERVICE_QUESTIONS } from '@/lib/content/questions';
import { QuestionCards } from '@/components/marketing/QuestionCards';
import { IncludesList } from '@/components/marketing/IncludesList';
import { Differentiators } from '@/components/marketing/Differentiators';
import { Testimonials } from '@/components/marketing/Testimonials';
import type { Testimonial } from '@/types/database';

export async function generateStaticParams() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('services')
      .select('slug, internal')
      .eq('active', true);
    return (data ?? [])
      .filter((s) => s.internal !== true)
      .map((s) => ({ slug: s.slug as string }));
  } catch {
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

  // Approved testimonials are intentionally public under RLS. Do not use the
  // service-role client for this public page: doing so makes an unrelated
  // server-only environment validation failure turn into a visitor-facing 500.
  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(3)
    .returns<Testimonial[]>();

  const mode = MODE[service.mode];
  const photo = serviceImage(service.slug);
  const contextKey = serviceContextImage(service.slug);
  const context = contextKey ? img(contextKey) : null;
  const cancellationHours = service.free_cancellation_hours ?? POLICY.freeCancellationHours;
  const reviews = testimonials ?? [];
  const questions = SERVICE_QUESTIONS[service.slug] ?? SERVICE_QUESTIONS['astrological-guidance'];

  const bookHref = service.bookable_online ? `/book?service=${service.slug}` : '/contact';
  const bookLabel = service.bookable_online ? 'Schedule a Call' : 'Enquire About This Service';

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

      <div className="pb-[var(--spacing-section-lg)] pt-8 md:pt-16">
        {/* ============================ 1. HERO ============================ */}
        <section className="shell mb-[var(--spacing-section-lg)]">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <Reveal className="relative z-10 md:col-span-6">
              <p className="label-caps text-[var(--color-saffron-deep)]">{service.title}</p>
              <h1 className="mt-4 text-[length:var(--text-display-lg)] text-[var(--color-cocoa)]">
                {service.tagline ?? service.title}
              </h1>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Button asChild size="lg" variant="primary" className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]">
                  <Link href={bookHref}>
                    {bookLabel}
                    <ArrowRight className="size-4 ml-2" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={120} className="md:col-span-6">
              <div className="relative aspect-[4/5] w-full bg-[var(--color-card-cream)] md:aspect-[3/2] border border-[var(--color-hairline)] before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  priority
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover contrast-[1.1] grayscale-[20%]"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========================== 2. STAT STRIP =========================== */}
        {/* ========================== 3. NARRATIVE =========================== */}
        <section aria-labelledby="narrative-heading" className="shell py-[var(--spacing-section-lg)]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 items-center">
            {context && (
              <Reveal className="md:col-span-5">
                <Image
                  src={context.src}
                  alt={context.alt}
                  width={1024}
                  height={1024}
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="hidden aspect-[4/5] w-full border border-[var(--color-hairline)] object-cover md:block grayscale-[20%]"
                />
              </Reveal>
            )}
            <Reveal delay={100} className="md:col-span-7">
              <h2 id="narrative-heading" className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                This is not just a consultation
              </h2>
              <div className="prose-editorial mt-8 text-base text-[var(--color-body-warm)] leading-relaxed">
                <p className="whitespace-pre-line">{service.description}</p>
              </div>
              <div className="mt-10">
                <Button asChild size="lg" variant="secondary">
                  <Link href={bookHref}>{bookLabel}</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===================== 5. DIFFERENTIATORS ===================== */}
        <Differentiators />

        {/* ===================== 6. PROBLEM CARDS ===================== */}
        <QuestionCards questions={questions} />

        {/* ===================== 7. PRICING (BENTO) ===================== */}
        <section aria-labelledby="pricing-heading" className="shell mb-[var(--spacing-section-lg)]">
          <Reveal>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="relative overflow-hidden bg-[var(--color-card-cream)] p-10 md:col-span-8 md:p-16 border border-[var(--color-hairline)] before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10">
                <div className="relative z-20">
                  <h2 id="pricing-heading" className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                    Session Investment
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-body-warm)]">
                    A tailored one-to-one consultation directly with Komal Kalra.
                  </p>

                  <div className="mt-8 flex gap-4">
                    <div className="px-4 py-2 border border-[var(--color-saffron)] text-[var(--color-cocoa)] font-medium text-sm flex items-center gap-2">
                      <Clock className="size-4" /> {service.duration_minutes} Mins
                    </div>
                    <div className="px-4 py-2 border border-[var(--color-saffron)] text-[var(--color-cocoa)] font-medium text-sm flex items-center gap-2">
                      <mode.icon className="size-4" /> {mode.label}
                    </div>
                  </div>

                  <IncludesList highlights={service.highlights} />

                  <p className="mt-10 flex items-baseline gap-2">
                    <span className="tabular font-[family-name:var(--font-display)] text-5xl font-semibold text-[var(--color-cocoa)]">
                      {formatPaise(service.price_paise)}
                    </span>
                  </p>

                  <div className="mt-8">
                    <Button asChild size="lg" variant="primary" className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]">
                      <Link href={bookHref}>
                        {service.bookable_online ? 'Schedule a Call' : 'Enquire'}
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-body-warm)]">
                    Free cancellation up to {cancellationHours} hours before your session.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:col-span-4">
                <div className="flex flex-grow flex-col justify-center bg-[var(--color-cream)] border border-[var(--color-hairline)] p-10">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">
                    Suited for
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {service.ideal_for.slice(0, 3).map((item) => (
                      <li key={item} className="text-sm text-[var(--color-body-warm)] leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===================== 9. TESTIMONIALS ===================== */}
        <Testimonials testimonials={reviews} />

        {/* ============================ 10. FINAL CTA ============================ */}
        <section className="band-navy py-[var(--spacing-section-lg)] border-t border-white/20">
          <div className="shell flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-white">
                Ready for clarity?
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" variant="primary" className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]">
                <Link href={bookHref}>Schedule a Call &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ============================= 11. EXPECTATIONS ============================ */}
        <section aria-labelledby="faq-heading" className="shell py-[var(--spacing-section-lg)]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <h2 id="faq-heading" className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">Expectations</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-body-warm)]">
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
