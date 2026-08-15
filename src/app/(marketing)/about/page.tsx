import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { PortraitFrame } from '@/components/marketing/PortraitFrame';
import { FOUNDER } from '@/lib/content/founder';
import { img } from '@/lib/content/imagery';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: `About ${FOUNDER.name} — ${FOUNDER.role}`,
  description: FOUNDER.standfirst.slice(0, 155),
  alternates: { canonical: '/about' },
};

/**
 * About the founder.
 *
 * Copy comes from `lib/content/founder.ts`, which the homepage's "Why Choose"
 * block also reads — one biography, one source. Previously each page carried
 * its own placeholder prose, which is how two versions of a bio start to
 * disagree.
 *
 * Structured as `Person` + `hasOccupation` so the biography is machine-readable
 * for the brand/navigational searches this page is most likely to catch.
 */
export default function AboutPage() {
  const portrait = img('komalKalra');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: FOUNDER.name,
      jobTitle: FOUNDER.role,
      description: FOUNDER.standfirst,
      image: `${process.env.NEXT_PUBLIC_SITE_URL}${portrait.src}`,
      telephone: BRAND.phonesE164,
      sameAs: [BRAND.instagram],
      knowsAbout: FOUNDER.competencies.map((c) => c.title),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ============================ MASTHEAD ============================ */}
      <section className="band-low border-b border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-md)]">
        <div className="shell grid grid-cols-1 items-center gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            <p className="label-caps text-[var(--color-gold-deep)]">About the founder</p>

            <h1 className="mt-5 text-[length:var(--text-display-lg)]">{FOUNDER.name}</h1>

            <p className="label-caps mt-5 text-[var(--color-on-surface-variant)]">
              {FOUNDER.role}
            </p>

            <span className="gold-rule mt-8" aria-hidden />

            <p className="standfirst mt-8">{FOUNDER.standfirst}</p>
          </Reveal>

          {/* Portrait: square source in a 4/5 crop, focal point raised so the
              frame does not cut through her head. */}
          <Reveal delay={120} className="md:col-span-5 md:col-start-8">
            <PortraitFrame
              src={portrait.src}
              alt={portrait.alt}
              priority
              aspect="portrait"
              objectPosition="50% 22%"
              sizes="(min-width: 768px) 38vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      {/* ============================ APPROACH ============================ */}
      <section aria-labelledby="approach-heading" className="py-[var(--spacing-section-lg)]">
        <div className="shell grid grid-cols-1 gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <h2 id="approach-heading" className="text-[length:var(--text-h2)]">
              The approach
            </h2>
            <span className="gold-rule mt-6" aria-hidden />
          </Reveal>

          <Reveal delay={100} className="md:col-span-8">
            <div className="prose-editorial text-base">
              {FOUNDER.body.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================== COMPETENCIES ========================== */}
      <section
        aria-labelledby="competencies-heading"
        className="band-low border-y border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-lg)]"
      >
        <div className="shell">
          <Reveal>
            <h2 id="competencies-heading" className="text-[length:var(--text-h2)]">
              {FOUNDER.competenciesHeading}
            </h2>
            <span className="gold-rule mt-6" aria-hidden />
          </Reveal>

          {/* Numbered, hairline-separated rows rather than cards — the spec's
              "structural lines mimicking a luxury broadsheet". Four cards here
              would repeat the service grid and flatten the hierarchy. */}
          <dl className="mt-14 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)]">
            {FOUNDER.competencies.map((item, i) => (
              <Reveal key={item.title} delay={i * 70}>
                <div className="grid grid-cols-1 gap-4 border-b border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] py-8 md:grid-cols-12 md:gap-12">
                  <span className="label-small tabular text-[var(--color-muted-gold)] md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <dt className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cosmic-navy)] md:col-span-4">
                    {item.title}
                  </dt>
                  <dd className="text-base leading-relaxed text-[var(--color-on-surface-variant)] md:col-span-7">
                    {item.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* =========================== FOUNDER NOTE ========================= */}
      <section aria-labelledby="note-heading" className="py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <figure className="border-l border-[color-mix(in_srgb,var(--color-muted-gold)_35%,transparent)] pl-8 md:pl-12">
              <figcaption className="label-caps text-[var(--color-gold-deep)]">
                <h2 id="note-heading" className="label-caps font-[family-name:var(--font-sans)] font-semibold text-[var(--color-gold-deep)]">
                  {FOUNDER.note.heading}
                </h2>
              </figcaption>

              <blockquote className="pull-quote mt-8">
                &ldquo;{FOUNDER.note.quote}&rdquo;
              </blockquote>

              <p className="label-caps mt-8 text-[var(--color-cosmic-navy)]">
                — {FOUNDER.note.attribution}
              </p>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ============================ CLOSING ============================= */}
      <section className="band-navy py-[var(--spacing-section-md)]">
        <div className="shell flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-[length:var(--text-h2)] text-[var(--color-warm-ivory)]">
              Ready when you are
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-on-primary-container)]">
              Choose a time that suits you, or call first if you would rather talk it through.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" variant="onDark">
              <Link href="/book">
                Book a Consultation
                <ArrowRight className="size-4" aria-hidden />
              </Link>
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
