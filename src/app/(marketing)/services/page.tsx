import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveServices } from '@/lib/booking/availability';
import { ExpertiseList } from '@/components/marketing/ExpertiseList';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/config';
import { img } from '@/lib/content/imagery';

export const metadata: Metadata = {
  title: 'Consultation Services',
  description:
    'Astrological guidance, Kundli Milan, life coaching, healing and counselling with Komal Kalra. Fixed fees, clear durations, booked online.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();
  const introImage = img('templeBellsBanner');

  return (
    <>
      {/*
        The original page header, restored.

        This briefly carried a pinned full-height panel with a 3D card row
        fanning open on scroll. It was reverted deliberately — a pinned hero
        reserves most of a viewport of scroll before the page will move, and on
        a page whose job is to get someone into a service, that is a toll
        charged before any of the content. The services themselves are covered
        properly by the expertise list below.

        The banner is masked to fade in from the left rather than cropped, so
        the headline sits on flat colour and stays legible whatever the
        photograph is doing behind it.
      */}
      <section className="band-terracotta relative overflow-hidden py-[var(--spacing-section-md)]">
        <Image
          src={introImage.src}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-0 object-cover"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, transparent 36%, black 82%, black 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, transparent 36%, black 82%, black 100%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-terracotta)]/75" />

        <div className="shell relative z-10">
          <Reveal>
            <p className="label-caps text-[var(--color-cream)]">The Practice</p>
            <div className="inline-block text-left">
              <h1 className="mt-4 max-w-3xl text-[length:var(--text-h1)]">Consultation Services</h1>
              <span
                className="gold-rule mt-6 !w-[calc(100%+1rem)] max-w-none bg-[var(--color-saffron-lift)]"
                aria-hidden
              />
            </div>
            <p className="standfirst mt-6 text-[var(--color-cream)]">
              Every session is one-to-one and confidential. Fees and durations are shown
              upfront — nothing is added at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      {/*
        Everything from here down follows the reference homepage's running
        order, with our own content and palette:

          statement  →  the plain claim, largest type after the h1
          expertise  →  service titles sharing one image, hover to swap
          closing    →  oversized CTA
          wordmark   →  repeating brand strip above the footer

        These no longer carry `relative z-10`. That existed only so they would
        rise OVER the pinned hero; with the hero back in normal flow there is
        nothing to stack against, and leaving it in would be a stacking context
        that means nothing to anyone reading this later.

        Band rhythm: terracotta → cream → sand → navy → cream.
        `npm run audit:bands` enforces that no two neighbours match.
      */}

      {/* ---------------------------- STATEMENT ---------------------------- */}
      <section className="band-cream py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <h2 className="max-w-4xl font-[family-name:var(--font-display)] text-[clamp(2rem,1.4rem+2.8vw,4rem)] font-semibold leading-[1.05] text-[var(--color-cocoa)]">
              She doesn&rsquo;t predict at you.
              <br />
              <span className="text-[var(--color-saffron-deep)]">She thinks it through with you.</span>
            </h2>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--color-body-warm)]">
              Every session is one conversation with one person. You bring the question you
              actually have; Komal reads what the chart says about it and tells you plainly
              what she sees — including when the answer is that nothing needs doing yet.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------- EXPERTISE ---------------------------- */}
      <section aria-labelledby="expertise-heading" className="band-sand py-[var(--spacing-section-lg)]">
        <div className="shell mb-14">
          <Reveal>
            <p className="label-caps text-[var(--color-saffron-deep)]">What she does</p>
            <h2 id="expertise-heading" className="mt-4 text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
              Choose the conversation
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-body-warm)]">
              Point at any of these to see what a session looks like.
            </p>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <ExpertiseList services={services} />
        </Reveal>
      </section>

      {/* --------------------------- CLOSING CTA --------------------------- */}
      <section className="band-navy py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <p className="label-caps text-[var(--color-saffron-lift)]">Still deciding</p>
            <h2 className="display-xxl mt-6 max-w-4xl text-[var(--color-cream)]">
              Not sure which one?
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-[var(--color-on-primary-container)]">
              Describe what is going on and Komal will tell you which session fits — or that
              none of them does. Sessions are booked and paid for online.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Button asChild size="lg" variant="onDark">
                <Link href="/book">Book a Consultation</Link>
              </Button>
              <a
                href={`tel:${BRAND.phonesE164[0]}`}
                className="label-caps border-b border-[var(--color-saffron-lift)] pb-1 text-[var(--color-saffron-lift)] transition-opacity hover:opacity-80"
              >
                Call {BRAND.phones[0]}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- WORDMARK STRIP ------------------------ */}
      <section aria-hidden className="band-cream overflow-hidden py-10">
        <div className="wordmark-marquee">
          {/* Rendered twice — the animation translates -50%, so the second copy
              is already in place when the first scrolls out and there is no
              visible seam or reset. */}
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="px-8 font-[family-name:var(--font-display)] text-[clamp(2.5rem,1.5rem+4vw,5rem)] font-semibold uppercase tracking-[0.08em] text-[var(--color-deep-maroon)]"
                >
                  {BRAND.fullName}
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
