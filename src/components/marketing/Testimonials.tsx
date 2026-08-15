import { Quote } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import type { Testimonial } from '@/types/database';

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
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section
      aria-labelledby="more-reviews"
      className="band-low border-t border-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)] py-[var(--spacing-section-md)]"
    >
      <div className="shell">
        <h2 id="more-reviews" className="label-caps text-[var(--color-gold-deep)]">
          More reflections
        </h2>

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={i * 80}>
              <figure className="flex h-full flex-col border border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] bg-[var(--color-warm-ivory)] p-8">
                <Quote className="size-6 text-[var(--color-muted-gold)] opacity-50" aria-hidden />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-[var(--color-on-surface-variant)]">
                  {t.review}
                </blockquote>
                <figcaption className="mt-6 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-5">
                  <p className="label-caps text-[var(--color-cosmic-navy)]">
                    {t.display_initials_only
                      ? t.author_name.split(/\s+/).map((p) => `${p[0]}.`).join(' ')
                      : t.author_name}
                  </p>
                  {t.author_location && (
                    <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{t.author_location}</p>
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
