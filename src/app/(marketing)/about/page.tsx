import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { PortraitFrame } from '@/components/marketing/PortraitFrame';
import { ServiceGrid } from '@/components/marketing/ServiceGrid';
import { FOUNDER } from '@/lib/content/founder';
import { img } from '@/lib/content/imagery';
import { BRAND } from '@/lib/config';
import { getActiveServices } from '@/lib/booking/availability';

export const metadata: Metadata = {
  title: `About ${FOUNDER.name} — ${FOUNDER.role}`,
  description: FOUNDER.standfirst.slice(0, 155),
  alternates: { canonical: '/about' },
};

const FOUNDER_STORY = [
  {
    image: 'komalKalra2' as const,
    label: 'A grounded practice',
    heading: 'Space to ask the real question',
    body: 'Komal creates a calm, confidential space where the practical details of life and the deeper patterns underneath them can be held together.',
  },
  {
    image: 'komalKalra' as const,
    label: 'Clearer perspective',
    heading: 'Insight that meets you where you are',
    body: 'Every reading begins with listening. The work is to turn a complex chart into language that feels useful, honest, and possible to act on.',
  },
  {
    image: 'komalKalra4' as const,
    label: 'The work continues',
    heading: 'Guidance you can return to',
    body: 'A consultation is not a prediction set in stone. It is a thoughtful reference point for making decisions with more steadiness and self-trust.',
  },
];

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
export default async function AboutPage() {
  const services = await getActiveServices();
  const portrait = img('komalKalra5');

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
      <section className="band-terracotta py-[var(--spacing-section-md)] text-[var(--color-cream)]">
        <div className="shell grid grid-cols-1 items-center gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            <p className="label-caps text-[var(--color-cream)]">About the founder</p>

            <div className="w-fit">
              <h1 className="mt-5 text-[length:var(--text-display-lg)]">{FOUNDER.name}</h1>
              <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
            </div>

            <p className="label-caps mt-5 text-[var(--color-cream)] opacity-90">
              {FOUNDER.role}
            </p>

            <p className="standfirst mt-8 !text-[var(--color-cream)]">{FOUNDER.standfirst}</p>
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
              frameStyle="gallery"
            />
          </Reveal>
        </div>
      </section>

      {/* ============================ APPROACH ============================ */}
      <section aria-labelledby="approach-heading" className="py-[var(--spacing-section-lg)]">
        <div className="shell grid grid-cols-1 gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <div className="w-fit">
              <h2 id="approach-heading" className="text-[length:var(--text-h2)]">
                The approach
              </h2>
              <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
            </div>
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

      {/* ========================= FOUNDER STORY ========================= */}
      <section aria-labelledby="founder-story-heading" className="band-cream py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <div className="max-w-2xl">
              <p className="label-caps text-[var(--color-saffron-deep)]">The practice in pictures</p>
              <div className="w-fit">
                <h2 id="founder-story-heading" className="mt-4 text-[length:var(--text-h2)]">
                  A quieter way to find your way forward
                </h2>
                <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
              </div>
            </div>
          </Reveal>

          <div className="mt-16 space-y-20 md:space-y-28">
            {FOUNDER_STORY.map((story, index) => {
              const photo = img(story.image);
              const imageFirst = index % 2 === 0;

              return (
                <div key={story.heading} className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
                  <Reveal
                    delay={index * 80}
                    className={imageFirst ? 'md:col-span-5' : 'md:col-span-5 md:col-start-8 md:row-start-1'}
                  >
                    <PortraitFrame
                      src={photo.src}
                      alt={photo.alt}
                      aspect="portrait"
                      objectPosition="50% 30%"
                      sizes="(min-width: 768px) 34vw, 100vw"
                      frameStyle="gallery"
                    />
                  </Reveal>

                  <Reveal
                    delay={index * 80 + 100}
                    className={imageFirst ? 'md:col-span-6 md:col-start-7' : 'md:col-span-6 md:col-start-1 md:row-start-1'}
                  >
                    <div className="max-w-lg">
                      <p className="label-caps text-[var(--color-saffron-deep)]">{story.label}</p>
                      <div className="w-fit">
                        <h3 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--color-cocoa)] md:text-4xl">
                          {story.heading}
                        </h3>
                        <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
                      </div>
                      <p className="mt-6 text-base leading-relaxed text-[var(--color-body-warm)]">{story.body}</p>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================== COMPETENCIES ========================== */}
      <section
        aria-labelledby="competencies-heading"
        className="band-sand py-[var(--spacing-section-lg)]"
      >
        <div className="shell">
          <Reveal>
            <div className="w-fit">
              <h2 id="competencies-heading" className="text-[length:var(--text-h2)]">
                {FOUNDER.competenciesHeading}
              </h2>
              <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
            </div>
          </Reveal>

          {/* Numbered, hairline-separated rows rather than cards — the spec's
              "structural lines mimicking a luxury broadsheet". Four cards here
              would repeat the service grid and flatten the hierarchy. */}
          <dl className="mt-14 border-t border-[var(--color-hairline)]">
            {FOUNDER.competencies.map((item, i) => (
              <Reveal key={item.title} delay={i * 70}>
                <div className="grid grid-cols-1 gap-4 border-b border-[var(--color-hairline)] py-8 md:grid-cols-12 md:gap-12">
                  <span className="label-small tabular text-[var(--color-saffron)] md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <dt className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)] md:col-span-4">
                    {item.title}
                  </dt>
                  <dd className="text-base leading-relaxed text-[var(--color-body-warm)] md:col-span-7">
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
        <div className="shell grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-5">
            <PortraitFrame
              src={img('komalKalra').src}
              alt={img('komalKalra').alt}
              aspect="square"
              objectPosition="50% 24%"
              sizes="(min-width: 768px) 34vw, 100vw"
              frameStyle="gallery"
            />
          </Reveal>

          <Reveal delay={100} className="md:col-span-6 md:col-start-7">
            <figure className="border-l border-[var(--color-hairline)] pl-8 md:pl-12">
              <figcaption className="label-caps text-[var(--color-saffron-deep)]">
                <h2 id="note-heading" className="label-caps font-[family-name:var(--font-sans)] font-semibold text-[var(--color-saffron-deep)]">
                  {FOUNDER.note.heading}
                </h2>
              </figcaption>

              <blockquote className="pull-quote mt-8">
                &ldquo;{FOUNDER.note.quote}&rdquo;
              </blockquote>

              <p className="label-caps mt-8 text-[var(--color-cocoa)]">
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
            <h2 className="text-[length:var(--text-h2)] text-[var(--color-card-cream)]">
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
              className="label-caps border-b border-[var(--color-saffron-lift)] pb-1 text-[var(--color-saffron-lift)] transition-opacity hover:opacity-80"
            >
              {BRAND.phones[0]}
            </a>
          </div>
        </div>
      </section>

      {/* ============================ SERVICES ============================ */}
      <section
        aria-labelledby="about-services-heading"
        className="band-cream py-[var(--spacing-section-lg)]"
      >
        <div className="shell">
          <Reveal>
            <div className="max-w-2xl">
              <p className="label-caps text-[var(--color-saffron-deep)]">
                Private consultations
              </p>
              <div className="w-fit">
                <h2
                  id="about-services-heading"
                  className="mt-4 text-[length:var(--text-h2)]"
                >
                  Choose the conversation that fits
                </h2>
                <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
              </div>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-body-warm)]">
                Each session is shaped around the questions you are carrying now,
                with clear guidance you can return to long after the call.
              </p>
            </div>
          </Reveal>

          <div className="mt-12">
            <ServiceGrid services={services} compactDesktop />
          </div>
        </div>
      </section>
    </>
  );
}
