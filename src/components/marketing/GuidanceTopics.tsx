import Link from 'next/link';
import { ArrowUpRight, Briefcase, Clock, Compass, Heart, Shield, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { GUIDANCE_TOPICS } from '@/lib/content/topics';
import type { Service } from '@/types/database';

const ICONS = {
  compass: Compass,
  briefcase: Briefcase,
  heart: Heart,
  sparkles: Sparkles,
  shield: Shield,
  clock: Clock,
} as const;

/**
 * Per-topic colour.
 *
 * `icon` tints the glyph plate, `edge` is the top rule that appears on hover,
 * `text` is the link colour. All three come from the same hue so a card reads
 * as one object rather than three coloured parts.
 *
 * These are full class strings, not interpolated fragments — Tailwind's
 * scanner cannot see `bg-[var(--color-${tone}-tint)]`, and a dynamically built
 * class would silently produce an unstyled card in production.
 */
const TONES = {
  indigo: {
    plate: 'bg-[var(--color-indigo-tint)]',
    icon: 'text-[var(--color-indigo)]',
    text: 'text-[var(--color-indigo)]',
    edge: 'bg-[var(--color-indigo)]',
    ring: 'group-hover:border-[var(--color-indigo)]/35',
  },
  terracotta: {
    plate: 'bg-[var(--color-terracotta-tint)]',
    icon: 'text-[var(--color-terracotta)]',
    text: 'text-[var(--color-terracotta)]',
    edge: 'bg-[var(--color-terracotta)]',
    ring: 'group-hover:border-[var(--color-terracotta)]/35',
  },
  rose: {
    plate: 'bg-[var(--color-rose-tint)]',
    icon: 'text-[var(--color-rose)]',
    text: 'text-[var(--color-rose)]',
    edge: 'bg-[var(--color-rose)]',
    ring: 'group-hover:border-[var(--color-rose)]/35',
  },
  plum: {
    plate: 'bg-[var(--color-plum-tint)]',
    icon: 'text-[var(--color-plum)]',
    text: 'text-[var(--color-plum)]',
    edge: 'bg-[var(--color-plum)]',
    ring: 'group-hover:border-[var(--color-plum)]/35',
  },
  jade: {
    plate: 'bg-[var(--color-jade-tint)]',
    icon: 'text-[var(--color-jade)]',
    text: 'text-[var(--color-jade)]',
    edge: 'bg-[var(--color-jade)]',
    ring: 'group-hover:border-[var(--color-jade)]/35',
  },
  teal: {
    plate: 'bg-[var(--color-teal-tint)]',
    icon: 'text-[var(--color-teal)]',
    text: 'text-[var(--color-teal)]',
    edge: 'bg-[var(--color-teal)]',
    ring: 'group-hover:border-[var(--color-teal)]/35',
  },
} as const;

/**
 * "What's on your mind?"
 *
 * Problem-framed entry points, adapted from the reference site's strongest
 * section. Two deliberate differences from the reference:
 *
 *  1. Each card ROUTES somewhere specific. The reference's equivalent cards are
 *     decorative — they describe topics but all sit under one generic CTA,
 *     which wastes the intent the visitor just expressed.
 *  2. Cards for services that do not exist in the database are dropped rather
 *     than linking into nothing. Content cannot break routing.
 *
 * COLOUR: six topics, six hues, stable mapping. This is the section that most
 * needed colour — six identical cream cards is exactly the monotony the first
 * pass produced.
 */
export function GuidanceTopics({ services }: { services: Service[] }) {
  const bySlug = new Map(services.map((s) => [s.slug, s]));

  const topics = GUIDANCE_TOPICS.map((topic) => {
    const service = bySlug.get(topic.serviceSlug);
    return {
      ...topic,
      href: service ? `/services/${service.slug}` : '/services',
      serviceTitle: service?.title ?? null,
    };
  });

  return (
    <section aria-labelledby="topics-heading" className="band-dawn py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
            Where to start
          </p>
          <h2 id="topics-heading" className="mt-5 max-w-2xl text-[length:var(--text-h2)]">
            What&apos;s on your mind?
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-bark)]">
            Start from what is actually happening rather than from a list of services.
            Komal will tell you if a different session would serve you better.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, i) => {
            const Icon = ICONS[topic.icon];
            const tone = TONES[topic.tone];
            return (
              <Reveal as="li" key={topic.id} delay={i * 50}>
                <Link
                  href={topic.href}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)] ${tone.ring}`}
                >
                  {/* Hue rule along the top edge, revealed on hover. */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${tone.edge}`}
                  />

                  <span className={`flex size-11 items-center justify-center rounded-[var(--radius-control)] ${tone.plate}`}>
                    <Icon className={`size-5 ${tone.icon}`} aria-hidden />
                  </span>

                  <h3 className="mt-5 font-sans text-[15px] font-semibold text-[var(--color-ink)]">
                    {topic.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-stone)]">
                    {topic.description}
                  </p>

                  <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${tone.text}`}>
                    {topic.serviceTitle ?? 'See consultations'}
                    <ArrowUpRight
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
