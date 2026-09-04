import Link from 'next/link';
import Image from 'next/image';
import { Clock, GitCompareArrows, Handshake, Sparkles, Timer, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { img, serviceCardImage } from '@/lib/content/imagery';
import type { Service } from '@/types/database';
import { publicPrice } from '@/lib/money';

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
 * Price goes through publicPrice(), which returns null while fees are not being
 * published. The research finding still stands — hiding a price adds a
 * "request a quote" round trip and loses buyers who are ready now — but it
 * assumed the site could take the money. It cannot at the moment: payment is
 * arranged in conversation, so the quote step exists either way and printing a
 * figure here would only be the wrong half of it.
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
  const cardKey = serviceCardImage(service.slug);
  const photo = cardKey ? img(cardKey) : null;

  // Kundli Milan's card photograph is portrait, and in the designed five-card
  // layout it shares a grid row with the wide Astrological Guidance card —
  // whose fixed-aspect image is what sets that row's height. So instead of
  // cropping Kundli Milan's image into the same 16:10 box as the rest (which
  // wastes the portrait framing and leaves the card looking short), let it
  // grow to fill whatever height the row already has. This only works because
  // a neighbour in the row has an intrinsic (aspect-ratio) height to anchor
  // to — so it's scoped to md+, where that bento row-sharing actually happens.
  // Below md the grid collapses to one stacked column and Kundli Milan has no
  // neighbour to borrow height from, so flex-1 with no fallback would collapse
  // to zero — it needs the same fixed aspect ratio as every other card there.
  const fillImageHeight = service.slug === 'kundli-milan';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden border border-[var(--color-hairline)] transition-colors duration-500',
        'before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10',
        tone === 'linen' ? 'bg-[var(--color-card-cream)]' : 'bg-[var(--color-cream)]',
        'hover:bg-[var(--color-card-cream)]',
        className,
      )}
    >
      {/* No photograph on this card renders text-only rather than borrowing
          another service's imagery — see serviceCardImage(). Grayscale to
          color on hover is the same restrained, one-motion-at-a-time
          treatment as the rest of the editorial photography on this site.
          Scoped to md+ only: below that there is no hover to reveal the
          color, so the photo would just sit grayscale forever on a phone. */}
      {photo && (
        <div
          className={cn(
            'relative w-full overflow-hidden aspect-[16/10]',
            fillImageHeight && 'md:aspect-auto md:flex-1',
          )}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover transition-[filter] duration-700 ease-out md:grayscale md:group-hover:grayscale-0"
          />
        </div>
      )}

      <div className={cn('flex flex-1 flex-col justify-between p-8 sm:p-10', fillImageHeight && 'md:flex-none')}>
        <div>
          {Icon !== Sparkles && <Icon className="size-7 text-[var(--color-saffron)]" aria-hidden />}

          <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cocoa)]">
            {/* Stretched link: the whole tile is the target, but only the title
                carries the accessible link name. */}
            <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
              {service.title}
            </Link>
          </h3>

          <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--color-body-warm)]">
            {service.tagline ?? service.description.slice(0, 140)}
          </p>

          <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-body-warm)]">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Duration</dt>
              <Clock className="size-3.5 text-[var(--color-saffron)]" aria-hidden />
              <dd className="label-small">{service.duration_minutes} MIN</dd>
            </div>
            {/* The whole <div> goes, not just the value — a "Session fee"
                label with nothing beside it reads as a loading failure. */}
            {publicPrice(service.price_paise) && (
              <div>
                <dt className="sr-only">Session fee</dt>
                <dd className="tabular label-small">{publicPrice(service.price_paise)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <span className="label-small tabular text-[var(--color-body-warm)]">
            {index !== undefined && total !== undefined
              ? `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
              : ''}
          </span>

          {/* Visual affordance only — the stretched link above is the real
              target, so this is aria-hidden to avoid a duplicate tab stop. */}
          <span
            aria-hidden
            className="label-caps border border-[var(--color-terracotta)] px-4 py-2 text-[var(--color-terracotta)] transition-colors duration-300 group-hover:bg-[var(--color-terracotta)] group-hover:text-white"
          >
            {service.bookable_online ? 'Explore' : 'Enquire'}
          </span>
        </div>
      </div>
    </article>
  );
}
