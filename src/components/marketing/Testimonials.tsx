import { Quote } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import type { Testimonial } from '@/types/database';
import { Band, type BandTone } from './Band';

/**
 * Secondary testimonials.
 *
 * The home design gives the lead review a full editorial treatment; this
 * renders any remaining approved reviews beneath it as quieter editorial
 * cards.
 *
 * Renders NOTHING when the list is empty, and there is no hardcoded fallback
 * anywhere in the codebase. That is structural rather than a promise: the site
 * cannot display a testimonial Komal has not approved.
 */
export function Testimonials({
  testimonials,
  /**
   * Background tone. Exposed because this component appears on both the
   * homepage and the service pages, whose neighbouring sections differ — a
   * fixed tone made it collide with whatever sat above it on one of them.
   * `npm run audit:bands` catches that collision.
   */
  tone = 'sand',
}: {
  testimonials: Testimonial[];
  tone?: BandTone;
}) {
  if (testimonials.length === 0) return null;

  return (
    <Band tone={tone} size="md" ruled aria-labelledby="more-reviews">
      <div className="shell">
        <h2 id="more-reviews" className="label-caps text-[var(--color-saffron-deep)]">
          More reflections
        </h2>

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 80}>
              <figure className="relative flex h-full flex-col border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10">
                <Quote className="size-6 text-[var(--color-saffron)] opacity-50" aria-hidden />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-[var(--color-body-warm)] relative z-20">
                  {t.review}
                </blockquote>
                <figcaption className="mt-6 border-t border-[var(--color-hairline)] pt-5 relative z-20">
                  <p className="label-caps text-[var(--color-cocoa)]">
                    {t.display_initials_only
                      ? t.author_name.split(/\s+/).map((p) => `${p[0]}.`).join(' ')
                      : t.author_name}
                  </p>
                  {t.author_location && (
                    <p className="mt-1 text-sm text-[var(--color-body-warm)] opacity-80">{t.author_location}</p>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </Band>
  );
}
