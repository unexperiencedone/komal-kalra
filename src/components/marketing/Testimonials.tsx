import { Star } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import type { Testimonial } from '@/types/database';

/**
 * Testimonials.
 *
 * Renders NOTHING when there are no approved reviews. That is deliberate and is
 * the mechanism by which this site cannot ship fake social proof: there is no
 * hardcoded fallback array anywhere in the codebase. An empty section is
 * honest; an invented one is the fastest way to lose the trust the rest of the
 * design is working to build.
 *
 * `display_initials_only` exists because astrology clients frequently want the
 * consultation kept private but are still happy to vouch for it.
 */
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" className="band-shell border-t border-[var(--color-linen)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <p className="accent-rule text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ember-text)]">
            In their words
          </p>
          <h2 id="testimonials-heading" className="mt-5 max-w-2xl text-[length:var(--text-h2)]">
            What people say after a session
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 60}>
              <figure className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-[var(--color-saffron-tint)] p-6">
                <div className="flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`size-3.5 ${s < t.rating ? 'fill-[var(--color-saffron)] text-[var(--color-saffron)]' : 'text-[var(--color-linen)]'}`}
                      aria-hidden
                    />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-[var(--color-bark)]">
                  {t.review}
                </blockquote>

                <figcaption className="mt-5 border-t border-[var(--color-linen)] pt-4 text-sm">
                  <span className="font-semibold text-[var(--color-ink)]">
                    {t.display_initials_only
                      ? t.author_name.split(/\s+/).map((p) => `${p[0]}.`).join(' ')
                      : t.author_name}
                  </span>
                  {t.author_location && (
                    <span className="text-[var(--color-stone)]"> · {t.author_location}</span>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
