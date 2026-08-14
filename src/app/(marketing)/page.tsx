import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, CalendarDays, CheckCircle2, CreditCard, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveServices } from '@/lib/booking/availability';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { Testimonials } from '@/components/marketing/Testimonials';
import { ContactForm } from '@/components/marketing/ContactForm';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { StickyCta } from '@/components/marketing/StickyCta';
import { BOOKING_FAQ } from '@/lib/content/faq';
import type { Testimonial } from '@/types/database';

export const metadata: Metadata = {
  title: 'Astrologer Komal Kalra — Clarity, Direction and Confidence',
  description:
    'Private one-to-one consultations with Komal Kalra: astrological guidance, Kundli Milan, life coaching, healing and counselling. Book an online session at a time that suits you.',
  alternates: { canonical: '/' },
};

/**
 * Landing page.
 *
 * A Server Component with zero client-side JavaScript for content. The only
 * interactive islands are the header menu, the FAQ accordion, the contact form
 * and the sticky mobile CTA.
 *
 * Section order follows the conversion research (docs/research.md §3.2): each
 * CTA sits at a point where the visitor has just acquired a reason to act.
 * There is deliberately no CTA after "About" — visitors reading a bio are
 * evaluating, not deciding, and a button there interrupts.
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
      .limit(6)
      .returns<Testimonial[]>(),
  ]);

  const reviews = testimonials ?? [];
  const averageRating = reviews.length
    ? reviews.reduce((sum, t) => sum + t.rating, 0) / reviews.length
    : 0;

  // Structured data. Prices come from the database, so a rich result can never
  // drift out of sync with what the site actually charges.
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
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/#business`,
        name: BRAND.fullName,
        telephone: BRAND.phonesE164[0],
        priceRange: '₹₹',
        areaServed: 'IN',
        ...(reviews.length > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviews.length,
          },
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: BOOKING_FAQ.slice(0, 6).map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ================= HERO ================= */}
      <section className="constellation-motif relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-linen)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-bark)]">
                  <Sparkles className="size-3.5 text-[var(--color-saffron)]" aria-hidden />
                  Private one-to-one consultations
                </p>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="mt-6 text-[length:var(--text-display)]">
                  Find clarity.
                  <br />
                  Choose your direction.
                  <br />
                  <span className="text-[var(--color-ember)]">Move forward with confidence.</span>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--color-bark)]">
                  Komal Kalra reads your chart properly, listens to what is actually happening,
                  and gives you something you can act on. No vague predictions, no pressure —
                  just an honest conversation about where you are and what comes next.
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/book">
                      Book a consultation <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/services">Explore services</Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-stone)]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-[var(--color-sage)]" aria-hidden />
                    Free cancellation up to 24 hours before
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-[var(--color-sage)]" aria-hidden />
                    Secure online payment
                  </span>
                </p>
              </Reveal>
            </div>

            {/*
              Portrait placeholder.
              Left as a labelled placeholder rather than filled with a stock
              image: the brief asks for authentic, personal photography, and a
              stock portrait of someone who is not Komal would undermine exactly
              the trust this page is built to establish.
            */}
            <Reveal delay={140} className="hidden lg:block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-linen)] bg-[var(--color-linen)]">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-bark)]">
                    Portrait of Komal
                  </p>
                  <p className="max-w-[22ch] text-xs leading-relaxed text-[var(--color-stone)]">
                    PLACEHOLDER — add a real photograph at
                    <code className="mx-1 rounded bg-white px-1 py-0.5">/public/komal-portrait.jpg</code>
                    and replace this block.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <TrustStrip reviewCount={reviews.length} averageRating={averageRating} />

      {/* ================= ABOUT ================= */}
      <section aria-labelledby="about-heading" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
                About Komal
              </p>
              <h2 id="about-heading" className="mt-3 text-[length:var(--text-h2)]">
                An honest reading, and a conversation that actually helps
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <div className="space-y-4 text-[16px] leading-relaxed text-[var(--color-bark)]">
                {/* PLACEHOLDER BIO — replace with Komal's own words before launch. */}
                <p>
                  Komal Kalra works across astrology, coaching, healing and counselling. What
                  connects them is a way of working rather than a technique: she starts by
                  understanding what is genuinely going on for you, then uses whichever of
                  those lenses is actually useful.
                </p>
                <p>
                  Sessions are unhurried and private. You will not be told your life is cursed,
                  sold a remedy you did not ask for, or given a prediction dressed up as
                  certainty. Where the charts are clear, she will say so. Where they are not,
                  she will say that too.
                </p>
                <p>
                  People usually come at a turning point — a marriage under consideration, a
                  career decision, a period that has not lifted. They leave with a clearer view
                  of the situation and a next step they can actually take.
                </p>
                <p className="rounded-[var(--radius-control)] border-l-2 border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] px-4 py-3 text-sm">
                  <strong className="font-semibold">Note for launch:</strong> this biography is a
                  placeholder written from the brief. Replace it with Komal&apos;s own words and
                  credentials before going live.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section aria-labelledby="services-heading" className="border-y border-[var(--color-linen)] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
              Consultations
            </p>
            <h2 id="services-heading" className="mt-3 max-w-2xl text-[length:var(--text-h2)]">
              Choose the conversation you need
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-bark)]">
              Every session is one-to-one and confidential. Prices and durations are shown
              upfront — there is nothing added at checkout.
            </p>
          </Reveal>

          {services.length > 0 ? (
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <Reveal as="li" key={service.id} delay={i * 60}>
                  <ServiceCard service={service} featured={service.featured} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <p className="mt-12 rounded-[var(--radius-card)] border border-dashed border-[var(--color-linen)] p-10 text-center text-sm text-[var(--color-stone)]">
              Services will appear here once they are added from the admin dashboard.
            </p>
          )}

          {/* CTA #2 — placed here because the visitor now knows the price. */}
          <Reveal delay={120}>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg">
                <Link href="/book">
                  Check available times <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section aria-labelledby="how-heading" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
              How it works
            </p>
            <h2 id="how-heading" className="mt-3 max-w-2xl text-[length:var(--text-h2)]">
              Booked in about two minutes
            </h2>
          </Reveal>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: 'Choose a service', body: 'Pick the consultation that fits what you want to discuss.' },
              { icon: CalendarDays, title: 'Pick a time', body: 'Live availability. Your slot is held while you check out.' },
              { icon: CreditCard, title: 'Pay securely', body: 'UPI, card or netbanking through Razorpay. Instantly confirmed.' },
              { icon: MessageCircle, title: 'Attend your session', body: 'A joining link arrives by email before your appointment.' },
            ].map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 70}>
                <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-saffron-tint)] text-sm font-semibold text-[var(--color-ember)]">
                      {i + 1}
                    </span>
                    <step.icon className="size-4 text-[var(--color-stone)]" aria-hidden />
                  </div>
                  <p className="mt-4 font-sans text-[15px] font-semibold">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-stone)]">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={100}>
            <p className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white px-5 py-4 text-center text-sm leading-relaxed text-[var(--color-bark)]">
              {POLICY.cancellationSummary}
            </p>
          </Reveal>
        </div>
      </section>

      <Testimonials testimonials={reviews} />

      {/* ================= FAQ ================= */}
      <section aria-labelledby="faq-heading" className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
              Questions
            </p>
            <h2 id="faq-heading" className="mt-3 text-[length:var(--text-h2)]">
              Before you book
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8">
              <FaqAccordion items={BOOKING_FAQ} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section aria-labelledby="contact-heading" className="border-y border-[var(--color-linen)] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
                Not sure yet?
              </p>
              <h2 id="contact-heading" className="mt-3 text-[length:var(--text-h2)]">
                Ask first. Book later.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-bark)]">
                If you are not sure which consultation fits, or you would rather speak to
                someone first, send a message or call. Komal reads every enquiry personally.
              </p>

              <ul className="mt-8 space-y-3">
                {BRAND.phones.map((phone, i) => (
                  <li key={phone}>
                    <a
                      href={`tel:${BRAND.phonesE164[i]}`}
                      className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-linen)] px-4 py-3 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-saffron)]"
                    >
                      <Phone className="size-4 text-[var(--color-saffron)]" aria-hidden />
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={80}>
              <ContactForm services={services} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="bg-[var(--color-ink)] py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl px-5">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)] text-[var(--color-sand)]">
              The answer is usually simpler than it feels
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-sand-muted)]">
              One conversation is often enough to see the situation clearly. Pick a time that
              suits you — you can cancel free of charge up to 24 hours beforehand.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/book">
                  Book a consultation <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-[var(--color-sand)] hover:border-white/40 hover:text-white"
              >
                <a href={`tel:${BRAND.phonesE164[0]}`}>
                  <Phone aria-hidden /> {BRAND.phones[0]}
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
