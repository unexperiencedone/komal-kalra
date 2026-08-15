import Link from 'next/link';
import { Clock, GitCompareArrows, Handshake, Sparkles, Timer, Waves } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/database';

/**
 * Service card — the "bento" tile from the home design.
 *
 * Editorial card rules: Linen Grey or Surface High fill on the Warm Ivory
 * page, a 1px Muted Gold hairline, sharp corners, no shadow. Hover shifts the
 * fill one tonal step and firms the hairline.
 *
 * The `01 / 05` counter in the footer is the spec's "Pagination — simple
 * numerical indicators to maintain the literary aesthetic". It is passed in
 * rather than derived so the grid can number cards in display order.
 *
 * Price is shown because hiding it forces a "request a quote" step that adds a
 * day of latency and loses buyers who are ready now — a finding from the
 * earlier research pass that the visual redesign does not change.
 */

const SERVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'astrological-guidance': Timer,
  'life-coaching': Sparkles,
  'healing-session': Waves,
  counselling: Handshake,
  'kundli-milan': GitCompareArrows,
};

export function ServiceCard({
  service,
  index,
  total,
  tone = 'linen',
  className,
}: {
  service: Service;
  index?: number;
  total?: number;
  /** Alternating tonal fill, matching the bento layout in the design. */
  tone?: 'linen' | 'high';
  className?: string;
}) {
  const Icon = SERVICE_ICON[service.slug] ?? Sparkles;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col justify-between border border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] p-8 transition-colors duration-500 sm:p-10',
        tone === 'linen' ? 'bg-[var(--color-linen-grey)]' : 'bg-[var(--color-surface-high)]',
        'hover:border-[color-mix(in_srgb,var(--color-muted-gold)_45%,transparent)] hover:bg-[var(--color-surface-container)]',
        className,
      )}
    >
      <div>
        <Icon className="size-7 text-[var(--color-muted-gold)]" aria-hidden />

        <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cosmic-navy)]">
          {/* Stretched link: the whole tile is the target, but only the title
              carries the accessible link name. */}
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {service.title}
          </Link>
        </h3>

        <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--color-on-surface-variant)]">
          {service.tagline ?? service.description.slice(0, 140)}
        </p>

        <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-on-surface-variant)]">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-3.5 text-[var(--color-muted-gold)]" aria-hidden />
            <dd className="label-small">{service.duration_minutes} MIN</dd>
          </div>
          <div>
            <dt className="sr-only">Session fee</dt>
            <dd className="tabular label-small">{formatPaise(service.price_paise)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <span className="label-small tabular text-[var(--color-on-surface-variant)]">
          {index !== undefined && total !== undefined
            ? `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
            : ''}
        </span>

        {/* Visual affordance only — the stretched link above is the real
            target, so this is aria-hidden to avoid a duplicate tab stop. */}
        <span
          aria-hidden
          className="label-caps border-b border-[var(--color-cosmic-navy)] pb-1 text-[var(--color-cosmic-navy)] transition-colors duration-300 group-hover:border-[var(--color-muted-gold)] group-hover:text-[var(--color-gold-deep)]"
        >
          {service.bookable_online ? 'Explore' : 'Enquire'}
        </span>
      </div>
    </article>
  );
}
