import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveServices } from '@/lib/booking/availability';
import { ServiceTiltGallery } from '@/components/marketing/ServiceTiltGallery';
import { ExpertiseList } from '@/components/marketing/ExpertiseList';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/card';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Consultation Services',
  description:
    'Astrological guidance, Kundli Milan, life coaching, healing and counselling with Komal Kalra. Fixed fees, clear durations, booked online.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <>
      {/* Bold flat-colour hero + the card row sitting directly beneath the
          headline, both inside the same band — the vixorastudio.com
          composition this was modelled on, adapted to the site's own
          terracotta/gold palette rather than their orange/black.

          PIN-AND-COVER SCROLL EFFECT — the outer div is taller than one
          viewport (h-[180vh]); the hero inside it is `sticky top-0
          h-screen`, so it stays pinned to the viewport for that extra 80vh
          of scroll distance. The very next section in the DOM is normal
          flow with an opaque background, so once the reader has scrolled
          past that reserved distance it rises up and visually covers the
          still-pinned hero, rather than the two just trading places. */}
      <div className="pin-stage" style={{ ['--pin-travel' as string]: '85svh' }}>
        <section className="band-terracotta pin-panel overflow-hidden py-10 md:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, var(--color-cream) 0 1px, transparent 1px 80px), repeating-linear-gradient(to bottom, var(--color-cream) 0 1px, transparent 1px 80px)',
            }}
          />
          <div className="shell relative z-10">
            {/*
              Not wrapped in <Reveal>. Reveal waits for an IntersectionObserver
              to fire, and this block is above the fold — so on first paint the
              headline would sit invisible for a frame before appearing, which
              costs LCP on the largest text on the page. The line-reveal
              animation runs immediately on mount instead.
            */}
            <div>
              <p className="label-caps text-[var(--color-cream)]">The Practice</p>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,1.8rem+3.2vw,5.5rem)] font-semibold leading-[0.95] text-[var(--color-cream)]">
                <span className="line-reveal">
                  <span style={{ ['--line-delay' as string]: '80ms' }}>Consultation</span>
                </span>
                <span className="line-reveal">
                  <span
                    className="text-[var(--color-saffron-lift)]"
                    style={{ ['--line-delay' as string]: '200ms' }}
                  >
                    Services
                  </span>
                </span>
              </h1>
              <p className="standfirst mt-6 max-w-xl text-[var(--color-cream)]">
                Every session is one-to-one and confidential. Fees and durations are shown
                upfront — nothing is added at checkout.
              </p>

              {/*
                The "Scroll" cue, straight off the reference's own /services
                hero. It is not decoration: a pinned screen that does not move
                when you scroll reads as a frozen page, and this is the only
                thing telling the visitor the panel is holding on purpose.
                Hidden from assistive tech — a screen reader user is not
                scrolling and the panel has no meaning for them.
              */}
              <p aria-hidden className="label-caps mt-10 flex items-center gap-3 text-[var(--color-saffron-lift)]">
                Scroll
                <span className="scroll-cue-rule" />
              </p>
            </div>
          </div>

          {/*
            mt-auto drops the row to the bottom of the panel whatever height
            the headline takes. min-h-0 is required: a flex child defaults to
            min-height:auto, which refuses to shrink below its content and
            would push the row off the bottom instead of letting it compress.

            The negative bottom margin lets the cards bleed past the panel edge
            so they are cropped by the fold, as on the reference, rather than
            stopping neatly above it.
          */}
          <div className="relative z-10 mt-auto min-h-0 flex-1 pt-8 md:-mb-14 md:pt-10">
            <ServiceTiltGallery services={services} />
          </div>
        </section>
      </div>

      {/*
        Everything from here down is the reference HOMEPAGE running order,
        applied to this route with our own content and palette:

          statement  →  "We don't just design. We define."
          expertise  →  four titles sharing one image, hover to swap
          closing    →  "GOT AN IDEA?" at the largest type on the page
          wordmark   →  the repeating brand strip above the footer

        `relative z-10` on the first band is what makes it rise OVER the pinned
        hero rather than scrolling beneath it — an opaque background alone is
        not enough, the stacking context has to put it in front.
      */}

      {/* ---------------------------- STATEMENT ---------------------------- */}
      <section className="band-cream relative z-10 py-[var(--spacing-section-lg)]">
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
      <section aria-labelledby="expertise-heading" className="band-sand relative z-10 py-[var(--spacing-section-lg)]">
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
      <section className="band-navy relative z-10 py-[var(--spacing-section-lg)]">
        <div className="shell">
          <Reveal>
            <p className="label-caps text-[var(--color-saffron-lift)]">Still deciding</p>
            <h2 className="display-xxl mt-6 max-w-4xl text-[var(--color-cream)]">
              Not sure which one?
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-[var(--color-on-primary-container)]">
              Describe what is going on and Komal will tell you which session fits — or that
              none of them does. Free cancellation up to 24 hours before.
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
      <section aria-hidden className="band-cream relative z-10 overflow-hidden py-10">
        <div className="wordmark-marquee">
          {/* Rendered twice — the animation translates -50%, so the second copy
              is already in place when the first scrolls out and there is no
              visible seam or reset. */}
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="px-8 font-[family-name:var(--font-display)] text-[clamp(2.5rem,1.5rem+4vw,5rem)] font-semibold uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-cocoa)_16%,transparent)]"
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
