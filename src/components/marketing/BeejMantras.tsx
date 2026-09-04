'use client';

import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { BEEJ_MANTRAS, YOUTUBE_CHANNEL_URL } from '@/lib/content/mantras';
import { Reveal } from '@/components/common/Reveal';
import { Band, type BandTone } from './Band';
import { cn } from '@/lib/utils';

/**
 * The nine Navagraha beej mantras, played from Komal's own channel.
 *
 * THREE DECISIONS, none of them cosmetic.
 *
 * 1. NOTHING LOADS FROM YOUTUBE UNTIL SOMEONE PRESSES PLAY.
 *
 *    Nine embedded iframes is roughly nine megabytes of player JavaScript and
 *    nine sets of third-party cookies, on a page whose whole performance
 *    discipline so far has been to keep even the Razorpay script off every
 *    route but /book. It would also be a privacy change made silently: under
 *    the DPDP Act the visitor should not be handed to a third party for
 *    tracking merely by scrolling past a section. So each card is our own
 *    markup, no thumbnail fetched from ytimg, no request of any kind, until it
 *    is clicked. That is a genuine consent gesture, not a loading trick.
 *
 * 2. ONLY ONE PLAYS AT A TIME.
 *
 *    This is chanted audio. Two of these running together is not a minor
 *    annoyance, it is unusable — and worse for the material than for a
 *    normal video. Opening one closes the other, which is why `active` is a
 *    single id rather than a set.
 *
 * 3. THE CARD SHOWS THE MANTRA ITSELF.
 *
 *    A YouTube thumbnail grid would say nothing; the Devanagari and its
 *    transliteration are the content, and someone who knows these can read the
 *    right one without playing anything. It also lets the section sit in the
 *    site's own typography rather than looking like an embedded widget.
 *
 * `youtube-nocookie.com` is used for the same reason as (1): it is YouTube's
 * own reduced-tracking host, and once someone has chosen to play, it is the
 * least we can do with that choice.
 */
export function BeejMantras({
  tone = 'cream',
  heading = 'Beej mantras',
  standfirst = 'The nine Navagraha mantras, chanted 108 times. Free to use — play them here, or find the rest on the channel.',
}: {
  tone?: BandTone;
  heading?: string;
  standfirst?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Band tone={tone} size="lg" aria-labelledby="beej-mantras-heading">
      <div className="shell">
        <Reveal>
          <p className="label-caps text-[var(--color-saffron-deep)]">From the channel</p>
          <h2
            id="beej-mantras-heading"
            className="mt-4 text-[length:var(--text-h2)] text-[var(--color-cocoa)]"
          >
            {heading}
          </h2>
          <p className="standfirst mt-5 max-w-2xl text-[var(--color-body-warm)]">{standfirst}</p>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BEEJ_MANTRAS.map((m, i) => {
            const isActive = active === m.id;
            return (
              <Reveal as="li" key={m.id} delay={i * 60}>
                <div
                  className={cn(
                    'flex h-full flex-col border border-[var(--color-hairline)] bg-[var(--color-card-cream)] transition-colors',
                    isActive && 'border-[var(--color-saffron)]',
                  )}
                >
                  {isActive ? (
                    // 16:9 without an aspect-ratio utility, so it holds its shape
                    // before the iframe paints and the grid does not jump.
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute inset-0 size-full"
                        src={`https://www.youtube-nocookie.com/embed/${m.id}?autoplay=1&rel=0&modestbranding=1`}
                        title={`${m.planet} beej mantra — ${m.transliteration}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActive(m.id)}
                      className="group flex w-full flex-1 flex-col items-start p-6 text-left transition-colors hover:bg-[var(--color-cream)]"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-saffron)] text-[var(--color-on-saffron)] transition-transform group-hover:scale-110 motion-reduce:transition-none">
                          <Play className="size-4 fill-current" aria-hidden />
                        </span>
                        <span className="label-caps text-[var(--color-cocoa)]">
                          {m.planet}
                          <span className="ml-1.5 font-normal normal-case tracking-normal opacity-60">
                            {m.english}
                          </span>
                        </span>
                      </span>

                      <span
                        lang="sa"
                        className="mt-5 block font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-cocoa)]"
                      >
                        {m.sanskrit}
                      </span>
                      <span className="mt-2 block text-sm italic leading-relaxed text-[var(--color-body-warm)]">
                        {m.transliteration}
                      </span>

                      <span className="mt-5 text-xs uppercase tracking-[0.12em] text-[var(--color-saffron-deep)]">
                        Play 108 times
                      </span>
                    </button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={120}>
          <p className="mt-10 text-sm text-[var(--color-body-warm)]">
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-b border-[var(--color-saffron)] pb-0.5 transition-opacity hover:opacity-80"
            >
              More on Komal&rsquo;s YouTube channel
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
        </Reveal>
      </div>
    </Band>
  );
}
