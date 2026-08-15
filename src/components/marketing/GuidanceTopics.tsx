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
 * "What's on your mind?"
 *
 * Problem-framed entry points, adapted from the reference site's strongest
 * section. Two deliberate differences from the reference:
 *
 *  1. Each card ROUTES somewhere specific (the matching service's booking
 *     flow). The reference's equivalent cards are decorative — they describe
 *     topics but all four sit under one generic CTA, which wastes the intent
 *     the visitor just expressed.
 *  2. Cards for services that do not exist in the database are dropped rather
 *     than linking into nothing. Content cannot break routing.
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
    <section aria-labelledby="topics-heading" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron)]">
            Where to start
          </p>
          <h2 id="topics-heading" className="mt-3 max-w-2xl text-[length:var(--text-h2)]">
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
            return (
              <Reveal as="li" key={topic.id} delay={i * 50}>
                <Link
                  href={topic.href}
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-saffron)]/40 hover:shadow-[var(--shadow-overlay)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-saffron-tint)]">
                    <Icon className="size-[18px] text-[var(--color-ember)]" aria-hidden />
                  </span>

                  <h3 className="mt-5 font-sans text-[15px] font-semibold text-[var(--color-ink)]">
                    {topic.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-stone)]">
                    {topic.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ember)]">
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
