import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, Camera, Check, Quote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveServices } from '@/lib/booking/availability';
import { BRAND } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/card';
import { Reveal } from '@/components/common/Reveal';
import { ScrollWatermark } from '@/components/common/ScrollWatermark';
import { ServiceGrid } from '@/components/marketing/ServiceGrid';
import { Testimonials } from '@/components/marketing/Testimonials';
import { img } from '@/lib/content/imagery';
import type { Testimonial } from '@/types/database';

export const metadata: Metadata = {
  title: 'Astrologer Komal Kalra — Clarity for the Curated Life',
  description:
    'Professional astrological consultation and life coaching designed to provide precision, discretion, and profound insight. Book a private session with Komal Kalra.',
  alternates: { canonical: '/' },
};

/**
 * Home — built to the `komal_kalra_home_interactive` design.
 *
 * Section order and copy follow the design file. The one structural difference
 * is that services are read from the DATABASE rather than hardcoded as five
 * static tiles: prices, durations and titles are editable from the practitioner
 * console, and a marketing page that hardcodes a price will eventually contradict
 * what the checkout charges.
 *
 * Still a Server Component with no client-side JavaScript for content — the
 * only islands are the nav, the reveal observer and the testimonial carousel.
 */
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
      .limit(3)
      .returns<Testimonial[]>(),
  ]);

  const reviews = testimonials ?? [];
  const hero = img('heroPortrait');
  const about = img('aboutStill');
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
        // aggregateRating only when real approved reviews exist. Inventing
        // review markup earns a manual action, and would contradict the rest
        // of this build.
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/*
        Rashi Chakra watermark. Fixed behind the page, turning as it scrolls.
        Only shows through the sections below that carry no background of their
        own — the hero and the tonal/navy bands stay opaque, which gives the
        mark a rhythm of appearing and receding rather than being permanently
        on screen.
      */}
      <ScrollWatermark />

      {/* ========================= HERO — cinematic ========================= */}
      <section className="band-low relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden py-20 md:min-h-[819px] md:py-[var(--spacing-section-md)]">
        <div className="absolute inset-0 z-0">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80 mix-blend-multiply grayscale-[30%]"
          />
          {/* Ivory scrim — left-to-right on desktop, top-to-bottom on mobile
              where the headline sits over the middle of the frame. */}
          <div className="hero-scrim absolute inset-0" aria-hidden />
        </div>

        <div className="shell relative z-10 grid w-full grid-cols-1 gap-[var(--spacing-gutter)] md:grid-cols-12">
          <div className="flex flex-col justify-center md:col-span-6">
            <Reveal>
              <p className="label-caps text-[var(--color-gold-deep)]">Trusted Guidance</p>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="mt-6 text-[length:var(--text-display-lg)]">
                Clarity for the
                <br />
                Curated Life
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
                Professional astrological consultation and life coaching designed to provide
                precision, discretion, and profound insight.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Button asChild size="lg">
                  <Link href="/book">Book a Consultation</Link>
                </Button>
                <Link
                  href="/services"
                  className="label-caps border-b border-[var(--color-cosmic-navy)] pb-1 text-[var(--color-cosmic-navy)] transition-colors duration-300 hover:border-[var(--color-muted-gold)] hover:text-[var(--color-gold-deep)]"
                >
                  Explore Services
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ====================== CONSULTATION SERVICES ====================== */}
      <section aria-labelledby="services-heading" className="py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <div className="mb-16 md:w-1/2">
              <h2 id="services-heading" className="text-[length:var(--text-h2)]">
                Consultation Services
              </h2>
              <span className="gold-rule mt-6" aria-hidden />
              <p className="mt-6 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                A tailored approach to understanding your unique path, combining ancient wisdom
                with modern executive coaching.
              </p>
            </div>
          </Reveal>

          <ServiceGrid services={services} />
        </div>
      </section>

      {/* ===================== THE APPROACH / WHY CHOOSE ==================== */}
      <section
        aria-labelledby="about-heading"
        className="band-low border-t border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-lg)]"
      >
        <div className="shell grid grid-cols-1 items-center gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <Image
              src={about.src}
              alt={about.alt}
              width={800}
              height={1000}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="aspect-[4/5] w-full border border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] object-cover"
            />
          </Reveal>

          <Reveal delay={120} className="md:col-span-6 md:col-start-7">
            <p className="label-caps text-[var(--color-gold-deep)]">The Approach</p>
            <h2 id="about-heading" className="mt-4 text-[length:var(--text-h1)]">
              Why Choose Komal Kalra
            </h2>

            <div className="mt-8 space-y-6 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
              {/* PLACEHOLDER COPY — from the design file. Replace with Komal's
                  own words and real credentials before launch. */}
              <p>
                The practice is built on a foundation of absolute discretion and profound
                analytical rigor. Moving away from esoteric clichés, the focus is on providing
                actionable intelligence derived from astrological systems.
              </p>
              <p>
                Every consultation is treated as a high-level executive briefing. You receive a
                structured, objective perspective on your current reality and upcoming cycles,
                empowering you to make decisions from a place of clarity rather than anxiety.
              </p>
            </div>

            <ul className="mt-10 space-y-4 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
              {[
                'Strict Confidentiality Protocols',
                'Evidence-Based Astrological Interpretations',
                'Action-Oriented Coaching Methodologies',
              ].map((item) => (
                <li key={item} className="flex items-center gap-4 text-[var(--color-on-surface)]">
                  <Check className="size-4 shrink-0 text-[var(--color-muted-gold)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ================= SOCIAL PROOF + CURATED INSIGHTS ================= */}
      <section aria-labelledby="proof-heading" className="py-[var(--spacing-section-md)]">
        <h2 id="proof-heading" className="sr-only">What clients say, and where to follow along</h2>

        <div className="shell grid grid-cols-1 gap-16 md:grid-cols-2">
          {/*
            Testimonial. Renders only when a real approved review exists —
            there is no hardcoded fallback quote anywhere in this codebase, so
            the section is simply absent until Komal approves one.
          */}
          {reviews.length > 0 ? (
            <Reveal>
              <figure className="flex h-full flex-col justify-center border-l border-[color-mix(in_srgb,var(--color-muted-gold)_30%,transparent)] pl-8">
                <Quote className="size-9 text-[var(--color-muted-gold)] opacity-50" aria-hidden />
                <blockquote className="mt-6 font-[family-name:var(--font-display)] text-2xl italic leading-relaxed text-[var(--color-cosmic-navy)]">
                  &ldquo;{reviews[0].review}&rdquo;
                </blockquote>
                <figcaption className="mt-8">
                  <p className="label-caps text-[var(--color-cosmic-navy)]">
                    {reviews[0].display_initials_only
                      ? reviews[0].author_name.split(/\s+/).map((p) => `${p[0]}.`).join(' ')
                      : reviews[0].author_name}
                  </p>
                  {reviews[0].author_location && (
                    <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                      {reviews[0].author_location}
                    </p>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ) : (
            <Reveal>
              <div className="flex h-full flex-col justify-center border-l border-[color-mix(in_srgb,var(--color-muted-gold)_30%,transparent)] pl-8">
                <p className="label-caps text-[var(--color-gold-deep)]">In their words</p>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                  Client reflections appear here once they have been reviewed and approved.
                  Nothing is published without Komal&apos;s explicit approval.
                </p>
              </div>
            </Reveal>
          )}

          {/* Curated Insights — Instagram teaser */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col items-center border border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] bg-[var(--color-linen-grey)] p-8 text-center sm:p-10">
              <Camera className="size-7 text-[var(--color-cosmic-navy)]" aria-hidden />
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium">
                Curated Insights
              </h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                Follow for regular reflections on timing, energy management, and leading a
                conscious professional life.
              </p>

              <div className="mt-8 grid w-full grid-cols-2 gap-4">
                {[gramA, gramB].map((g) => (
                  <div
                    key={g.src}
                    className="aspect-square overflow-hidden border border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] bg-[var(--color-surface-container)]"
                  >
                    <Image
                      src={g.src}
                      alt={g.alt}
                      width={600}
                      height={600}
                      sizes="(min-width: 768px) 22vw, 45vw"
                      className="size-full object-cover opacity-80 transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="label-caps mt-8 inline-flex items-center gap-2 border-b border-[var(--color-cosmic-navy)] pb-1 text-[var(--color-cosmic-navy)] transition-colors duration-300 hover:border-[var(--color-muted-gold)] hover:text-[var(--color-gold-deep)]"
              >
                View Instagram
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Additional approved reviews, if there are more than the featured one. */}
      <Testimonials testimonials={reviews.slice(1)} />

      {/* ============================ FINAL CTA ============================ */}
      <section className="band-navy py-[var(--spacing-section-md)]">
        <div className="shell flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <SectionHeading
              eyebrow="Begin"
              title="A single conversation is often enough"
              onDark
            />
            <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-on-primary-container)]">
              Choose a time that suits you. Free cancellation up to 24 hours beforehand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" variant="onDark">
              <Link href="/book">Book a Consultation</Link>
            </Button>
            <a
              href={`tel:${BRAND.phonesE164[0]}`}
              className="label-caps border-b border-[var(--color-gold-light)] pb-1 text-[var(--color-gold-light)] transition-opacity hover:opacity-80"
            >
              {BRAND.phones[0]}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
