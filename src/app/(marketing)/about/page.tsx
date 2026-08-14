import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/Reveal';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About Komal Kalra',
  description:
    'Komal Kalra works across astrology, coaching, healing and counselling. An honest reading and a conversation that actually helps.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <section className="constellation-motif border-b border-[var(--color-linen)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Reveal>
            <h1 className="text-[length:var(--text-h1)]">About Komal Kalra</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-[var(--color-bark)]">
              {BRAND.tagline}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          {/*
            PLACEHOLDER BIOGRAPHY.
            Written from the brief so the page is complete and well-structured,
            but this must be replaced with Komal's own words and real
            credentials before launch. A biography is the single most
            trust-bearing block on a personal-practice site, and inventing
            credentials would be both dishonest and legally risky.
          */}
          <Reveal>
            <div className="rounded-[var(--radius-control)] border-l-2 border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] px-4 py-3 text-sm">
              <strong className="font-semibold">Placeholder content.</strong> This biography
              was written from the project brief. Replace it with Komal&apos;s own words,
              training and credentials before going live.
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="mt-10 space-y-5 text-[16px] leading-relaxed text-[var(--color-bark)]">
              <p>
                Komal Kalra works across four disciplines — astrology, life coaching, healing
                and counselling. They sound like separate practices, and in most places they
                are. What connects them here is a way of working rather than a technique.
              </p>
              <p>
                Every session starts with the same question: what is actually going on? Only
                then does the method get chosen. Sometimes the chart explains everything and
                the conversation is astrological. Sometimes the chart is beside the point and
                what someone needs is a clear-headed hour with a person who will listen
                properly. Both are on offer, and Komal will tell you which one she thinks you
                need.
              </p>

              <h2 className="pt-4 text-[length:var(--text-h3)]">How the sessions work</h2>
              <p>
                Sessions are unhurried, one-to-one and private. Most are held over a video
                call so distance is not an obstacle. You will be asked for birth details
                where they are relevant, and told plainly when they are not.
              </p>
              <p>
                You will not be told your life is cursed. You will not be sold a remedy you
                did not ask about. You will not be given a prediction dressed up as
                certainty. Where the charts are clear, Komal will say so. Where they are
                ambiguous, she will say that too — which is more often than most
                practitioners admit.
              </p>

              <h2 className="pt-4 text-[length:var(--text-h3)]">Who tends to book</h2>
              <p>
                People usually arrive at a turning point. A marriage proposal under
                consideration. A career decision that has been circling for months. A period
                that has not lifted and no clear reason why. They leave with a clearer view
                of the situation and, usually, one concrete next step.
              </p>

              <h2 className="pt-4 text-[length:var(--text-h3)]">What this is not</h2>
              <p>
                Consultations are for guidance and personal reflection. They are not a
                substitute for medical, psychological, legal or financial advice. Where
                something needs a doctor, a therapist, a lawyer or an accountant, you will be
                told so directly rather than worked around.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14 rounded-[var(--radius-panel)] border border-[var(--color-linen)] bg-white p-8 text-center">
              <h2 className="text-[length:var(--text-h3)]">Ready when you are</h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-bark)]">
                Pick a time that suits you, or call first if you would rather talk it through.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild><Link href="/book">Book a consultation <ArrowRight aria-hidden /></Link></Button>
                <Button asChild variant="outline"><Link href="/contact">Send a message</Link></Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
