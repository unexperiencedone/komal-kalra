import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import type { Metadata } from 'next';
import { ArrowUpRight, Camera, Quote, PlayCircle } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import { getActiveServices } from '@/lib/booking/availability';
import { BRAND } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { ServiceGrid } from '@/components/marketing/ServiceGrid';
import { PurposeStatement } from '@/components/marketing/PurposeStatement';
import { Testimonials } from '@/components/marketing/Testimonials';
import { img } from '@/lib/content/imagery';
import { FOUNDER } from '@/lib/content/founder';
import { SUNIL } from '@/lib/content/sunil';
import type { Testimonial } from '@/types/database';
import { PortraitFrame } from '@/components/marketing/PortraitFrame';

import { IconStrip } from '@/components/marketing/IconStrip';
import { SectionWatermark } from '@/components/marketing/SectionWatermark';
import { Differentiators } from '@/components/marketing/Differentiators';
import { SeoProse } from '@/components/marketing/SeoProse';
import { ToolsLeadSection } from '@/components/marketing/ToolsLeadSection';
import { BeejMantras } from '@/components/marketing/BeejMantras';

export const metadata: Metadata = {
  title: 'Clarity for the Curated Life',
  description:
    'Professional astrological consultation and life coaching designed to provide precision, discretion, and profound insight. Book a private session with Komal Kalra.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  // Cookie-free: both these pages are prerendered, and cookies() cannot be read
  // during a prerender. Testimonials are public data with an `approved` RLS
  // policy, so the anon client returns exactly the right rows. See
  // src/lib/supabase/public.ts for the full reasoning.
  const supabase = createPublicClient();

  const [services, { data: testimonials }, { data: rated }] = await Promise.all([
    getActiveServices(),
    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(4)
      .returns<Testimonial[]>(),
    // Separate from the display query on purpose. The four rows above are a
    // page slice chosen for reading; an aggregate rating must describe EVERY
    // approved review that carries a star rating, or the number published in
    // structured data is a different claim from the one it appears to make.
    supabase
      .from('testimonials')
      .select('rating')
      .eq('approved', true)
      .not('rating', 'is', null)
      .returns<{ rating: number }[]>(),
  ]);

  const reviews = testimonials ?? [];

  const ratingSummary =
    rated && rated.length > 0
      ? {
          average: (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1),
          count: rated.length,
        }
      : null;
  const hero = img('practitionerPortrait');
  const heroWatermark = img('heroGraphic');
  const gramA = img('journalCompass');
  const gramB = img('journalCandle');
  const diya = img('diyaLamp');

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
        /*
          Only emitted when there is something real to say. Two things were
          wrong here before and both published a false number to Google:

          1. It averaged `reviews`, which is a .limit(4) SLICE for the page —
             so `reviewCount` reported however many quotes happened to fit on
             the homepage, not how many reviews exist. The count below is a
             separate exact count over every approved, rated review.

          2. It summed `t.rating` unconditionally. Ratings are now nullable —
             a WhatsApp message has no stars — so that sum would have gone
             NaN, and "fixing" it by defaulting NULL to 5 would be marking up
             a rating the client never gave. Unrated reviews are excluded from
             the average and from the count instead, which is the honest
             denominator.

          Worth knowing: Google has not shown review rich results for
          self-serving markup — a business rating itself on its own site —
          since 2019, so this most likely renders no stars in search either
          way. It stays because it is legitimate structured data about the
          business; it just must not be wrong.
        */
        ...(ratingSummary && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingSummary.average,
            reviewCount: ratingSummary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
    ],
  };

  return (
    <div className="overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script src="https://static.elfsight.com/platform/platform.js" strategy="lazyOnload" />


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
                Stuck on a decision? Not sure what the next year holds? Talk to Komal or Sunil directly — in English, Hindi, or Punjabi.
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
            <div className="relative mx-auto w-full max-w-md">
              <Image
                src={heroWatermark.src}
                alt=""
                aria-hidden
                width={900}
                height={900}
                className="hero-watermark pointer-events-none absolute left-1/2 top-1/2 z-0 size-[220%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-45"
              />
              <div className="relative z-10 aspect-[4/5] w-full border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-1 shadow-[8px_8px_0_0_var(--color-cocoa)]">
                <div className="relative z-10 size-full overflow-hidden border border-[var(--color-hairline)]">
                  <Image src={hero.src} alt={hero.alt} fill priority sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================== ICON QUICK ACCESS ====================== */}
      {/* Renders `sand`, so it does not run into the cream "Meet Our
          Astrologers" band below — terracotta → sand → cream. */}
      <IconStrip />

      {/* ======================= OUR ASTROLOGERS ======================= */}
      <section aria-labelledby="astrologers-heading" className="band-cream py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <div className="mb-16 md:w-1/2">
              <div className="w-fit">
                <h2 id="astrologers-heading" className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                  Meet Our Astrologers
                </h2>
                <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
              </div>
              <p className="mt-6 text-base leading-relaxed text-[var(--color-body-warm)]">
                Our practice offers consultations with two highly experienced practitioners, ensuring you find the right approach for your needs.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
            <Reveal delay={100}>
              <div className="flex flex-col gap-6">
                <div className="w-full max-w-sm">
                  <PortraitFrame
                    src={img('practitionerPortrait').src}
                    alt={img('practitionerPortrait').alt}
                    aspect="portrait"
                    objectPosition="50% 22%"
                    sizes="(min-width: 768px) 38vw, 100vw"
                    frameStyle="gallery"
                  />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">{FOUNDER.name}</h3>
                  <p className="label-caps mt-2 text-[var(--color-saffron-deep)]">{FOUNDER.role}</p>
                  <p className="mt-4 text-base leading-relaxed text-[var(--color-body-warm)] line-clamp-3">
                    {FOUNDER.standfirst}
                  </p>
                  <Button asChild variant="link" className="mt-4 p-0 text-[var(--color-terracotta)]">
                    <Link href="/about">Read more &rarr;</Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex flex-col gap-6">
                <div className="w-full max-w-sm">
                  <PortraitFrame
                    src={img('sunilSharma').src}
                    alt={img('sunilSharma').alt}
                    aspect="portrait"
                    objectPosition="50% 22%"
                    sizes="(min-width: 768px) 38vw, 100vw"
                    frameStyle="gallery"
                  />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">{SUNIL.name}</h3>
                  <p className="label-caps mt-2 text-[var(--color-saffron-deep)]">{SUNIL.role}</p>
                  <p className="mt-4 text-base leading-relaxed text-[var(--color-body-warm)] line-clamp-3">
                    {SUNIL.standfirst}
                  </p>
                  <Button asChild variant="link" className="mt-4 p-0 text-[var(--color-terracotta)]">
                    <Link href="/about#sunil">Read more &rarr;</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

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
      <section aria-labelledby="services-heading" className="band-sand relative isolate overflow-hidden py-[var(--spacing-section-lg)]">
        <Image src={diya.src} alt="" aria-hidden fill sizes="100vw" className="pointer-events-none absolute inset-0 -z-10 object-cover opacity-20" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[var(--color-card-cream)]/85" />
        <SectionWatermark corner="bottom-left" />
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
              Choose a time that suits you. Bookings are confirmed the moment you pay.
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

      {/*
        ========================== BEEJ MANTRAS ==========================
        `cream`, sitting between the navy CTA above and the sand social-proof
        band below — navy → cream → sand, so no two neighbours share a tone.
        `npm run audit:bands` enforces that.
      */}
      <BeejMantras tone="cream" />

      {/* ================= SOCIAL PROOF — immediately before footer ================= */}
      <section aria-labelledby="proof-heading" className="band-sand relative isolate overflow-hidden py-[var(--spacing-section-lg)]">
        <SectionWatermark corner="top-right" />
        <h2 id="proof-heading" className="sr-only">In their words and curated insights</h2>
        <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-3">
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
                  {/*
                    The lead quote is the single loudest claim on the homepage,
                    so it is the one place provenance matters most. Naming the
                    source makes it checkable rather than asking to be taken on
                    trust.
                  */}
                  {reviews[0].source !== 'site' && (
                    <span className="ml-2 font-normal normal-case tracking-normal opacity-60">
                      {reviews[0].source === 'google' ? '· Google review' : '· sent by WhatsApp'}
                    </span>
                  )}
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
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">Instagram</h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--color-body-warm)]">Follow reflections on timing, energy management, and leading a conscious professional life.</p>
              <div className="mt-8 w-full min-h-[250px] relative z-20 flex items-center justify-center">
                <div className="elfsight-app-f75946a7-3365-4b78-aa31-d78b5f528daf w-full" data-elfsight-app-lazy></div>
              </div>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="label-caps relative z-20 mt-8 border-b border-[var(--color-terracotta)] pb-1 text-[var(--color-terracotta)]">View Instagram <ArrowUpRight className="inline size-3.5" aria-hidden /></a>
            </div>
          </Reveal>
          
          <Reveal delay={240}>
            <div className="relative flex h-full flex-col items-center border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 text-center before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] sm:p-10">
              <PlayCircle className="size-7 text-[var(--color-cocoa)]" aria-hidden />
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">Latest from YouTube</h3>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--color-body-warm)]">Deep dives into astrological cycles, remedies, and structural life transitions.</p>
              <div className="mt-8 w-full min-h-[250px] relative z-20 flex items-center justify-center">
                <div className="elfsight-app-d3add452-2a47-4941-a0ed-f5a3c958e64e w-full" data-elfsight-app-lazy></div>
              </div>
              <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer" className="label-caps relative z-20 mt-8 border-b border-[var(--color-terracotta)] pb-1 text-[var(--color-terracotta)]">Watch on YouTube <ArrowUpRight className="inline size-3.5" aria-hidden /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Additional approved reviews, if there are more than the featured one. */}
      {/* Tone is cream to contrast with the sand of the Social Proof block above it. */}
      <Testimonials testimonials={reviews.slice(1)} tone="cream" />
    </div>
  );
}
