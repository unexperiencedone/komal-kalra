import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, Camera, Quote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveServices } from '@/lib/booking/availability';
import { BRAND } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { ServiceGrid } from '@/components/marketing/ServiceGrid';
import { PurposeStatement } from '@/components/marketing/PurposeStatement';
import { Testimonials } from '@/components/marketing/Testimonials';
import { img } from '@/lib/content/imagery';
import type { Testimonial } from '@/types/database';

import { IconStrip } from '@/components/marketing/IconStrip';
import { Differentiators } from '@/components/marketing/Differentiators';
import { SeoProse } from '@/components/marketing/SeoProse';
import { ToolsLeadSection } from '@/components/marketing/ToolsLeadSection';

export const metadata: Metadata = {
  title: 'Clarity for the Curated Life',
  description:
    'Professional astrological consultation and life coaching designed to provide precision, discretion, and profound insight. Book a private session with Komal Kalra.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const supabase = await createClient();

  const [services, { data: testimonials }] = await Promise.all([
    getActiveServices(),
    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(4)
      .returns<Testimonial[]>(),
  ]);

  const reviews = testimonials ?? [];
  const hero = img('komalKalra');
  const gramA = img('journalCompass');
  const gramB = img('journalCandle');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/#person`,
        name: BRAND.fullName,
        jobTitle: 'Astrologer, Life Coach & Counsellor',
        telephone: BRAND.phonesE164,
        sameAs: [BRAND.instagram],
        knowsLanguage: ['en', 'hi', 'pa'],
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/#business`,
        name: BRAND.fullName,
        telephone: BRAND.phonesE164[0],
        priceRange: '₹₹',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi', 'Punjabi'],
        ...(reviews.length > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (reviews.reduce((s, t) => s + t.rating, 0) / reviews.length).toFixed(1),
            reviewCount: reviews.length,
          },
        }),
      },
    ],
  };

  return (
    <div className="overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />


      {/* ========================= HERO — cinematic ========================= */}
      {/*
        Heights subtract the header, which now sits in normal flow (sticky, not
        fixed) — so the hero plus the header should come to one viewport, not
        one viewport plus the header. 5rem is the single-row mobile bar; 8rem is
        the two-row desktop one.
      */}
      <section className="band-terracotta py-16 md:py-[var(--spacing-section-md)]">
        <div className="hidden">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60 mix-blend-multiply grayscale-[30%]"
          />
          {/*
            ⚠️  NO `bg-gradient-to-*` UTILITY HERE. It used to carry
            `bg-gradient-to-r from-…/80 to-transparent` ALONGSIDE .hero-scrim.
            Both set `background-image`, the utility layer wins, and the
            three-stop scrim was silently replaced by a crude two-stop ramp —
            which is what put a hard vertical seam down the middle of the hero
            where the orange stopped and the photograph started.

            Same class of bug as the .band-navy one documented in globals.css:
            two rules competing for one property, the more specific one winning
            invisibly. If this hero needs a different fade, change .hero-scrim.
          */}
          <div className="hero-scrim absolute inset-0" aria-hidden />
        </div>

        <div className="shell grid items-center gap-12 md:grid-cols-12">
          <div className="relative flex flex-col justify-center md:col-span-7 lg:col-span-6">
            <Image src="/images/watermark-mark.webp" alt="" aria-hidden width={560} height={560} className="hero-watermark pointer-events-none absolute -left-24 top-1/2 z-0 ml-8 max-md:ml-16 max-md:-mt-2.5 size-[min(52rem,115vw)] -translate-y-1/2 object-contain opacity-15" />
            <Reveal>
              <div className="relative z-10 inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                Trusted Guidance
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="relative z-10 mt-6 font-[family-name:var(--font-display)] text-5xl leading-tight text-white md:text-7xl">
                Clarity for the
                <br />
                Curated Life
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="relative z-10 mt-8 max-w-lg text-lg leading-relaxed text-[var(--color-cream)]">
                Stuck on a decision? Not sure what the next year holds? Talk to Komal directly — in English, Hindi, or Punjabi.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="relative z-10 mt-10 flex flex-wrap items-center gap-6">
                <Button asChild size="lg" variant="primary">
                  <Link href="/book">Book a Consultation</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="bg-transparent text-white border-white hover:bg-white hover:text-[var(--color-terracotta)]">
                  <Link href="/services">Explore Services</Link>
                </Button>
              </div>
            </Reveal>
          </div>
          <Reveal delay={160} className="md:col-span-5 lg:col-span-6">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-1 shadow-[8px_8px_0_0_var(--color-cocoa)]">
              <div className="relative z-10 size-full overflow-hidden border border-[var(--color-hairline)]">
                <Image src={hero.src} alt={hero.alt} fill priority sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================== ICON QUICK ACCESS ====================== */}
      <IconStrip />

      {/* ====================== CONSULTATION SERVICES ====================== */}
      {/*
        BAND RHYTHM — the tones below alternate deliberately:

          terracotta → cream → sand → cream → sand → cream → sand → cream
                                                              → amber → footer

        Every one of these used to be cream or an alias of cream, which is why
        five sections ran together as a single slab. `npm run audit:bands`
        checks this ordering; do not add a section without giving it a tone
        that differs from its neighbour.

        The closing CTA is AMBER, not terracotta, specifically because the
        footer is a terracotta gradient — two terracotta blocks touching had
        no visible boundary at all.
      */}
      <section aria-labelledby="services-heading" className="band-sand py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <div className="mb-16 md:w-1/2">
              <div className="w-fit">
                <h2 id="services-heading" className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                  Our Services
                </h2>
                <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
              </div>
              <p className="mt-6 text-base leading-relaxed text-[var(--color-body-warm)]">
                Choose the conversation that fits what you are dealing with right now.
              </p>
            </div>
          </Reveal>

          <ServiceGrid services={services} compactDesktop />
        </div>
      </section>

      {/* ===================== DIFFERENTIATORS (Pitch Band) ==================== */}
      <Differentiators />

      <ToolsLeadSection />

      {/* Additional approved reviews, if there are more than the featured one. */}
      <Testimonials testimonials={reviews.slice(1)} />

      {/* ===================== SEO PROSE ===================== */}
      <SeoProse />

      {/* Purpose statement for OAuth */}
      <PurposeStatement />

      {/* ============================ FINAL CTA ============================ */}
      <section className="band-navy py-[var(--spacing-section-lg)] border-t border-white/25">
        <div className="shell flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-white">
              Still deciding? One call is usually all it takes
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-cream)]">
              Choose a time that suits you. Free cancellation up to 24 hours beforehand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" variant="primary" className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]">
              <Link href="/book">Schedule a Call &rarr;</Link>
            </Button>
            <a
              href={`tel:${BRAND.phonesE164[0]}`}
              className="label-caps border-b border-white pb-1 text-white transition-opacity hover:opacity-80"
            >
              {BRAND.phones[0]}
            </a>
          </div>
        </div>
      </section>

      {/* ================= SOCIAL PROOF — immediately before footer ================= */}
      <section aria-labelledby="proof-heading" className="band-sand py-[var(--spacing-section-lg)]">
        <h2 id="proof-heading" className="sr-only">In their words and curated insights</h2>
        <div className="shell grid grid-cols-1 gap-16 md:grid-cols-2">
          <Reveal>
            {reviews.length > 0 ? (
              <figure className="flex h-full flex-col justify-center border-l border-[var(--color-saffron)] pl-8">
                <Quote className="size-9 text-[var(--color-saffron)] opacity-50" aria-hidden />
                <blockquote className="mt-6 font-[family-name:var(--font-display)] text-2xl italic leading-relaxed text-[var(--color-cocoa)]">
                  &ldquo;{reviews[0].review}&rdquo;
                </blockquote>
                <figcaption className="mt-8 label-caps text-[var(--color-cocoa)]">
                  {reviews[0].display_initials_only
                    ? reviews[0].author_name.split(/\s+/).map((p) => `${p[0]}.`).join(' ')
                    : reviews[0].author_name}
                </figcaption>
              </figure>
            ) : (
              <div className="flex h-full flex-col justify-center border-l border-[var(--color-saffron)] pl-8">
                <p className="label-caps text-[var(--color-saffron-deep)]">In their words</p>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-body-warm)]">
                  Client reflections appear here once they have been reviewed and approved.
                  Nothing is published without Komal&apos;s explicit approval.
                </p>
              </div>
            )}
          </Reveal>
          <Reveal delay={120}>
            <div className="relative flex h-full flex-col items-center border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 text-center before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] sm:p-10">
              <Camera className="size-7 text-[var(--color-cocoa)]" aria-hidden />
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">Curated Insights</h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--color-body-warm)]">Follow reflections on timing, energy management, and leading a conscious professional life.</p>
              <div className="mt-8 grid w-full grid-cols-2 gap-4">
                {[gramA, gramB].map((g) => <Image key={g.src} src={g.src} alt={g.alt} width={600} height={600} className="relative z-20 aspect-square size-full border border-[var(--color-hairline)] object-cover opacity-80" />)}
              </div>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="label-caps relative z-20 mt-8 border-b border-[var(--color-terracotta)] pb-1 text-[var(--color-terracotta)]">View Instagram <ArrowUpRight className="inline size-3.5" aria-hidden /></a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
