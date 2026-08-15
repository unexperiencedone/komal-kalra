import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight, CalendarDays, CheckCircle2, CreditCard, Languages,
  MessageCircle, Phone, ShieldCheck, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveServices } from '@/lib/booking/availability';
import { getRealStats } from '@/lib/marketing/stats';
import { BRAND, POLICY } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { QuickLinks } from '@/components/marketing/QuickLinks';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { GuidanceTopics } from '@/components/marketing/GuidanceTopics';
import { StatsBand } from '@/components/marketing/StatsBand';
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
 * interactive islands are the header menu, the stats counters, the FAQ
 * accordion, the contact form and the sticky mobile CTA.
 *
 * SECTION ORDER — and why it is not the reference site's order.
 *
 * astroarunpandit.org leads with a product (a paid report), then a service
 * grid, then five separate lead-capture calculators. That works for a
 * multi-product content business selling to cold traffic.
 *
 * This is one practitioner with a finite calendar, so the order answers the
 * questions a visitor actually has, in the order they have them:
 *
 *   1. Hero            what is this, and can I act now
 *   2. Quick links     I already know what I want — let me go
 *   3. Trust strip     is this safe to pay for
 *   4. Guidance topics I have a problem, which session fits it   ← new
 *   5. About           who am I trusting
 *   6. Services        what exactly does it cost and how long
 *   7. How it works    what happens after I pay
 *   8. Stats           has anyone else done this                 ← real data only
 *   9. Testimonials    what did they say
 *  10. FAQ             my remaining objection
 *  11. Contact         I want to ask first
 *  12. Final CTA       decide
 *
 * CTAs sit at 1, 2, 6, 9 and 12 — each at a point where the visitor has just
 * acquired a reason to act (docs/research.md §3.2). Deliberately none after
 * "About": someone reading a biography is evaluating, not deciding.
 */
export default async function HomePage() {
  const supabase = await createClient();

  const [services, stats, { data: testimonials }] = await Promise.all([
    getActiveServices(),
    getRealStats(),
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

  const cheapest = services.length
    ? Math.min(...services.map((s) => s.price_paise))
    : null;

  // Structured data. Prices come from the database, so a rich result can never
  // drift out of sync with what the site actually charges. aggregateRating is
  // included only when real approved reviews exist — Google penalises invented
  // review markup, and inventing it would contradict the whole design.
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

      {/* ============================ 1. HERO ============================ */}
      <section className="band-dawn constellation-motif relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ember)]/25 bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ember-text)] shadow-[var(--shadow-resting)]">
                  <Sparkles className="size-3.5 text-[var(--color-ember-text)]" aria-hidden />
                  Private one-to-one consultations
                </p>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="mt-6 text-[length:var(--text-display)]">
                  Find clarity.
                  <br />
                  Choose your direction.
                  <br />
                  <span className="text-[var(--color-ember-text)]">Move forward with confidence.</span>
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
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/book">
                      Book a consultation <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/services">
                      {cheapest ? `See services from ₹${Math.round(cheapest / 100).toLocaleString('en-IN')}` : 'Explore services'}
                    </Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={240}>
                {/*
                  Language availability, taken from the reference site
                  ("Available in Hindi and English"). It genuinely matters in
                  this market and is a real question people hesitate over.
                */}
                <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-[var(--color-stone)]">
                  <li className="flex items-center gap-1.5">
                    <Languages className="size-3.5 text-[var(--color-indigo)]" aria-hidden />
                    English, Hindi &amp; Punjabi
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-[var(--color-jade)]" aria-hidden />
                    Free cancellation up to 24 hours before
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-[var(--color-jade)]" aria-hidden />
                    Confidential
                  </li>
                </ul>
              </Reveal>
            </div>

            {/*
              Portrait.
              Left as a labelled placeholder rather than filled with a stock
              image: the brief asks for authentic, personal photography, and a
              stock portrait of someone who is not Komal would undermine exactly
              the trust this page exists to establish.
            */}
            <Reveal delay={140} className="hidden lg:block">
              <div className="relative">
                <div className="band-night constellation-motif-dark relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-indigo-light)]/30 shadow-[var(--shadow-lifted)]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
                      <Sparkles className="size-5 text-[var(--color-marigold)]" aria-hidden />
                    </span>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-sand)]">
                      Portrait of Komal
                    </p>
                    <p className="max-w-[24ch] text-xs leading-relaxed text-[var(--color-indigo-on-dark)]">
                      PLACEHOLDER — add a real photograph at
                      <code className="mx-1 rounded bg-white/15 px-1 py-0.5">/public/komal-portrait.jpg</code>
                      and replace this block.
                    </p>
                  </div>
                </div>

                {/* Floating detail card — grounds the portrait and repeats the
                    two facts that most often decide a booking. */}
                <div className="absolute -bottom-5 -left-5 rounded-[var(--radius-card)] border border-[var(--color-linen)] border-l-4 border-l-[var(--color-ember)] bg-white p-4 shadow-[var(--shadow-overlay)]">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
                    Every session
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                    One-to-one, unhurried
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-stone)]">
                    Never a call centre, never a script
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================= 2. QUICK LINKS ======================== */}
      <QuickLinks />

      {/* ========================= 3. TRUST STRIP ======================== */}
      <TrustStrip reviewCount={reviews.length} averageRating={averageRating} />

      {/* ======================= 4. GUIDANCE TOPICS ====================== */}
      <GuidanceTopics services={services} />

      {/* ============================ 5. ABOUT ========================== */}
      <section aria-labelledby="about-heading" className="band-shell border-y border-[var(--color-linen)] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
                About Komal
              </p>
              <h2 id="about-heading" className="mt-5 text-[length:var(--text-h2)]">
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

      {/* =========================== 6. SERVICES ======================== */}
      <section aria-labelledby="services-heading" className="band-sand py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
              Consultations
            </p>
            <h2 id="services-heading" className="mt-5 max-w-2xl text-[length:var(--text-h2)]">
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

          {/* CTA — placed here because the visitor now knows the price. */}
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

      {/* ========================= 7. HOW IT WORKS ======================= */}
      <section aria-labelledby="how-heading" className="band-night constellation-motif-dark on-dark py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-marigold)]">
              How it works
            </p>
            <h2 id="how-heading" className="mt-5 max-w-2xl text-[length:var(--text-h2)]">
              Booked in about two minutes
            </h2>
          </Reveal>

          {/* Cards sit on the night ground, so they use a translucent white
              wash rather than a solid fill — a solid card here would read as a
              hole punched in the section. */}
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: 'Choose a service', body: 'Pick the consultation that fits what you want to discuss.' },
              { icon: CalendarDays, title: 'Pick a time', body: 'Live availability. Your slot is held while you check out.' },
              { icon: CreditCard, title: 'Pay securely', body: 'UPI, card or netbanking through Razorpay. Instantly confirmed.' },
              { icon: MessageCircle, title: 'Attend your session', body: 'A joining link arrives by email before your appointment.' },
            ].map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 70}>
                <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3">
                    <span className="tabular flex size-8 items-center justify-center rounded-full bg-[var(--color-marigold)] text-sm font-semibold text-[var(--color-indigo-deep)]">
                      {i + 1}
                    </span>
                    <step.icon className="size-4 text-[var(--color-marigold)]" aria-hidden />
                  </div>
                  <p className="mt-4 font-sans text-[15px] font-semibold text-[var(--color-sand)]">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={100}>
            <p className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-card)] border border-white/12 bg-white/[0.06] px-5 py-4 text-center text-sm leading-relaxed">
              {POLICY.cancellationSummary}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================ 8. STATS ========================== */}
      {/* Renders nothing until there is enough real data. See StatsBand. */}
      <StatsBand stats={stats} />

      {/* ========================= 9. TESTIMONIALS ====================== */}
      <Testimonials testimonials={reviews} />

      {/* ============================= 10. FAQ ========================== */}
      <section aria-labelledby="faq-heading" className="band-cool py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Reveal>
            <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
              Questions
            </p>
            <h2 id="faq-heading" className="mt-5 text-[length:var(--text-h2)]">
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

      {/* =========================== 11. CONTACT ======================== */}
      {/*
        Panel treatment adapted from the reference site's mid-page capture
        block, which sits on a decorative background and is visually distinct
        from the surrounding page. Theirs asks for seven fields to generate a
        free report; this asks for three, because the goal is a reply from a
        person rather than an automated lead magnet.
      */}
      <section aria-labelledby="contact-heading" className="band-sand py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="constellation-motif overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-linen)] bg-white shadow-[var(--shadow-lifted)]">
            <div className="grid gap-12 p-8 sm:p-12 lg:grid-cols-[0.85fr_1.15fr]">
              <Reveal>
                <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
                  Not sure yet?
                </p>
                <h2 id="contact-heading" className="mt-5 text-[length:var(--text-h2)]">
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
                        className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-linen)] bg-[var(--color-saffron-tint)] px-4 py-3 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ember)] hover:bg-white"
                      >
                        <Phone className="size-4 text-[var(--color-ember-text)]" aria-hidden />
                        {phone}
                      </a>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-xs leading-relaxed text-[var(--color-stone)]">
                  Enquiries are usually answered within one working day. For anything urgent,
                  calling is faster than the form.
                </p>
              </Reveal>

              <Reveal delay={80}>
                <ContactForm services={services} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== 12. FINAL CTA ======================== */}
      <section className="band-night constellation-motif-dark on-dark py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl px-5">
          <Reveal>
            <h2 className="text-[length:var(--text-h2)]">
              The answer is usually simpler than it feels
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed">
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
