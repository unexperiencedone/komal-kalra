import { Band } from './Band';
import { Reveal } from '@/components/common/Reveal';

/**
 * The long-form block below the fold. Its job is to be indexed — this is the
 * only substantial body copy on `/`, and the homepage had almost none.
 *
 * TWO BUGS FIXED HERE — both worth knowing before editing.
 *
 * 1. It used Tailwind's `prose prose-orange prose-headings:*` classes.
 *    `@tailwindcss/typography` is NOT installed, so every one of those was a
 *    no-op. Preflight resets heading margins to zero, so the h2s rendered at
 *    almost body size with no space above or below and the whole block read as
 *    one undifferentiated wall. `.prose-editorial` in globals.css does the job
 *    without the plugin.
 *
 * 2. It had no section heading and no eyebrow, so it began mid-thought
 *    directly under the testimonials with nothing marking it as a new section.
 *
 * The content is written as questions on purpose — it matches how people
 * actually search, and it is the register the reference site uses throughout.
 */

const ENTRIES = [
  {
    q: 'Why should you seek astrological guidance?',
    a: `Astrology is not about surrendering your agency to the planets; it is about
       understanding the currents you are swimming in. When success feels stalled, or a
       major life transition approaches, a professional consultation gives you an
       objective map of your personal timeline. It helps you tell the difference between
       a phase that asks for patience and a moment that demands a decision. Mapping your
       birth chart against the present gives you a real advantage in your career, your
       relationships and your own growth.`,
  },
  {
    q: 'What does a one-to-one session give you that a horoscope cannot?',
    a: `A generic daily horoscope cannot account for the specifics of your natal chart.
       In a private session, Komal reads your actual planetary placements, your running
       dashas and the transits currently touching them. You get direct answers to the
       questions you arrived with, rather than the hedged language of an automated
       report. Every session is a conversation, so you spend the time on what matters to
       you right now.`,
  },
  {
    q: 'How is this different from the large astrology platforms?',
    a: `Most online astrology platforms are built for volume, and treat a consultation as
       a commodity. This practice is built differently. You are not routed to whichever
       astrologer is free — you speak to Komal. There are no surprise fees, no
       fear-based predictions, and nothing is sold to you afterwards. The whole session
       goes on giving you clarity and something practical you can act on.`,
  },
  {
    q: 'What happens during your session?',
    a: `Come with specific questions, or with the general area you want to think through.
       The session runs in whichever you prefer of English, Hindi or Punjabi. Komal walks
       you through the themes currently active in your chart and explains the reasoning
       in plain language rather than jargon. You leave understanding what is influencing
       this period, what to do about it, and with a written summary you can return to.`,
  },
  {
    q: 'What if you do not know your exact birth time?',
    a: `Book anyway. An exact time sharpens the reading, particularly around house
       placements, but it is not a requirement — plenty of people do not have it, and
       "I am not sure" is a normal answer rather than a problem to solve first. Bring
       whatever you have, including an approximate window, and Komal will work with it.`,
  },
];

export function SeoProse() {
  return (
    <Band tone="cream">
      <div className="shell">
        <div className="mx-auto max-w-5xl">
          <header className="mb-14 max-w-2xl">
            <p className="label-caps text-[var(--color-saffron-deep)]">Before you book</p>
            <div className="w-fit">
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[length:var(--text-h2)] font-semibold leading-tight text-[var(--color-cocoa)]">
                Questions people ask first
              </h2>
              <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
            </div>
          </header>

          {/*
            Fragment, not a wrapping <div> per entry. `.prose-editorial`
            targets DIRECT children (`> h3 + *`, `> * + *`) to get the
            asymmetric heading spacing right — nesting each pair inside a div
            hides the h3 from those selectors and the spacing collapses back to
            the flat wall this component was written to fix.
          */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
            {[ENTRIES.filter((_, index) => index % 2 === 0), ENTRIES.filter((_, index) => index % 2 === 1)].map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-6 md:space-y-8">
                {column.map((entry, index) => (
                  <Reveal key={entry.q} delay={(index + columnIndex) * 120} as="article">
                    <article className="group border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 transition-colors duration-300 hover:bg-white md:p-8">
                      <span className="label-small text-[var(--color-saffron-deep)]">{String(columnIndex === 0 ? index * 2 + 1 : index * 2 + 2).padStart(2, '0')}</span>
                      <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-[var(--color-cocoa)] transition-colors group-hover:text-[var(--color-terracotta)]">
                        {entry.q}
                      </h3>
                      <p className="mt-4 text-[15px] leading-[1.75] text-[var(--color-body-warm)]">
                        {entry.a.replace(/\s+/g, ' ').trim()}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Band>
  );
}
