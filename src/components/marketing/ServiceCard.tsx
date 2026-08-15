import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Phone as PhoneIcon, User, Video } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import type { Service } from '@/types/database';

const MODE_ICON = { video: Video, phone: PhoneIcon, in_person: MapPin } as const;
const MODE_LABEL = { video: 'Video call', phone: 'Phone call', in_person: 'In person' } as const;

/**
 * Service card.
 *
 * Shows price AND duration on the card. Both are evidence-led: duration removes
 * the most common pre-purchase question, and hiding price forces a
 * "request a quote" step that adds a day of latency and loses buyers who are
 * ready now (docs/research.md §3.3).
 *
 * MICRO-BADGES — adapted from the reference site
 * astroarunpandit.org puts a small eyebrow badge on every service card
 * ("1-on-1", "India's No.1", "7L+ Sold", "Most Trusted"). It is a cheap and
 * effective trust device, and worth taking.
 *
 * What is NOT taken is where those values come from. Theirs are marketing
 * claims typed into a CMS. Every badge here is DERIVED FROM DATABASE TRUTH:
 *
 *   'Most booked'  ← services.featured, a flag Komal sets deliberately
 *   '1-on-1'       ← always true; this practice has one practitioner
 *   'Enquiry only' ← services.bookable_online = false
 *
 * There is no free-text badge field, and that is on purpose: a `badge_label`
 * column would be an open invitation to type "India's No.1" into it.
 */
export function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
  const ModeIcon = MODE_ICON[service.mode];

  const badge = featured
    ? { label: 'Most booked', tone: 'accent' as const }
    : !service.bookable_online
      ? { label: 'Enquiry only', tone: 'muted' as const }
      : { label: '1-on-1', tone: 'muted' as const };

  const badgeClass =
    badge.tone === 'accent'
      ? 'bg-[var(--color-ember)] text-white'
      : 'bg-[var(--color-linen)] text-[var(--color-bark)]';

  /**
   * Hue per card, keyed off the service slug so it is STABLE — the same service
   * is always the same colour, on every page, across reloads. A hash of the
   * slug rather than the array index, because index-based colour reshuffles the
   * whole grid whenever a service is reordered or deactivated.
   *
   * Decorative rather than semantic here: the five services are peers, so the
   * colour is carrying visual rhythm, not meaning.
   */
  const PALETTE = [
    { plate: 'bg-[var(--color-saffron-tint)]', icon: 'text-[var(--color-ember-text)]', edge: 'bg-[var(--color-ember)]' },
    { plate: 'bg-[var(--color-rose-tint)]',    icon: 'text-[var(--color-rose)]',       edge: 'bg-[var(--color-rose)]' },
    { plate: 'bg-[var(--color-indigo-tint)]',  icon: 'text-[var(--color-indigo)]',     edge: 'bg-[var(--color-indigo)]' },
    { plate: 'bg-[var(--color-jade-tint)]',    icon: 'text-[var(--color-jade)]',       edge: 'bg-[var(--color-jade)]' },
    { plate: 'bg-[var(--color-teal-tint)]',    icon: 'text-[var(--color-teal)]',       edge: 'bg-[var(--color-teal)]' },
    { plate: 'bg-[var(--color-plum-tint)]',    icon: 'text-[var(--color-plum)]',       edge: 'bg-[var(--color-plum)]' },
  ] as const;

  const hue = PALETTE[
    Math.abs(
      service.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7),
    ) % PALETTE.length
  ];

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-white p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-ember)]/40 hover:shadow-[var(--shadow-lifted)] ${
        featured ? 'border-[var(--color-ember)]/35' : 'border-[var(--color-linen)]'
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 origin-left transition-transform duration-300 ${hue.edge} ${
          featured ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
          {badge.label}
        </span>
        <span className={`flex size-10 items-center justify-center rounded-full ${hue.plate}`}>
          <ModeIcon className={`size-[18px] ${hue.icon}`} aria-hidden />
        </span>
      </div>

      <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
        {/* Stretched link: the whole card is the target, but only the title is
            the accessible link name. */}
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {service.title}
        </Link>
      </h3>

      {service.tagline && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark)]">{service.tagline}</p>
      )}

      <dl className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-stone)]">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Duration</dt>
          <Clock className="size-3.5" aria-hidden />
          <dd>{service.duration_minutes} minutes</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Format</dt>
          <User className="size-3.5" aria-hidden />
          <dd>{MODE_LABEL[service.mode]} with Komal</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--color-linen)] pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-stone)]">
            {service.compare_at_paise ? 'Now' : 'Session fee'}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="tabular font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              {formatPaise(service.price_paise)}
            </span>
            {service.compare_at_paise && (
              <span className="tabular text-sm text-[var(--color-stone)] line-through">
                {formatPaise(service.compare_at_paise)}
              </span>
            )}
          </p>
        </div>

        {/* Visual affordance only — the stretched link above is the real target,
            so this is aria-hidden and non-focusable to avoid a duplicate tab stop. */}
        <span
          aria-hidden
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-edge-hover)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:border-[var(--color-ember)] group-hover:bg-[var(--color-ember)] group-hover:text-white"
        >
          {service.bookable_online ? 'Book' : 'Enquire'}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
