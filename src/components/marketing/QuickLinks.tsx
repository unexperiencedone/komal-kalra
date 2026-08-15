import Link from 'next/link';
import { CalendarDays, HeartHandshake, MessageCircleQuestion, Phone, Users } from 'lucide-react';
import { BRAND } from '@/lib/config';

/**
 * Quick-access strip, directly under the hero.
 *
 * Adapted from the reference site's icon row, with two changes: five tiles
 * rather than eight (theirs half point at separate businesses — gemstones,
 * courses — which dilutes the one thing this page is for), and every tile is a
 * genuine destination in this product.
 *
 * Each tile carries its own hue so the row reads as a spectrum rather than a
 * line of identical cream boxes. The hue is decorative here rather than
 * semantic, which is the one place that is acceptable: these are five peers
 * with no meaningful category difference between them.
 *
 * Horizontally scroll-snapped on mobile, where this sits just below the fold
 * and is the first thing a returning visitor reaches for.
 */
const LINKS = [
  {
    href: '/book', label: 'Book a session', icon: CalendarDays,
    plate: 'bg-[var(--color-saffron-tint)]', icon_: 'text-[var(--color-ember-text)]',
    hover: 'hover:border-[var(--color-ember)]/40 hover:bg-[var(--color-saffron-tint)]',
  },
  {
    href: '/services/kundli-milan', label: 'Kundli Milan', icon: HeartHandshake,
    plate: 'bg-[var(--color-rose-tint)]', icon_: 'text-[var(--color-rose)]',
    hover: 'hover:border-[var(--color-rose)]/40 hover:bg-[var(--color-rose-tint)]',
  },
  {
    href: '/services', label: 'All services', icon: Users,
    plate: 'bg-[var(--color-indigo-tint)]', icon_: 'text-[var(--color-indigo)]',
    hover: 'hover:border-[var(--color-indigo)]/40 hover:bg-[var(--color-indigo-tint)]',
  },
  {
    href: '/contact', label: 'Ask a question', icon: MessageCircleQuestion,
    plate: 'bg-[var(--color-teal-tint)]', icon_: 'text-[var(--color-teal)]',
    hover: 'hover:border-[var(--color-teal)]/40 hover:bg-[var(--color-teal-tint)]',
  },
] as const;

const TILE =
  'group flex h-full flex-col items-center gap-2.5 rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white px-3 py-4 text-center transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5';

export function QuickLinks() {
  return (
    <nav aria-label="Quick links" className="band-shell border-b border-[var(--color-linen)]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-5 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-0">
          {LINKS.map(({ href, label, icon: Icon, plate, icon_, hover }) => (
            <li key={href} className="w-[136px] shrink-0 snap-start sm:w-auto">
              <Link href={href} className={`${TILE} ${hover}`}>
                <span className={`flex size-10 items-center justify-center rounded-full transition-colors group-hover:bg-white ${plate}`}>
                  <Icon className={`size-[18px] ${icon_}`} aria-hidden />
                </span>
                <span className="text-[13px] font-medium leading-tight text-[var(--color-ink)]">
                  {label}
                </span>
              </Link>
            </li>
          ))}

          {/* Phone is an <a>, not a Link — a tel: handoff, not a route. */}
          <li className="w-[136px] shrink-0 snap-start sm:w-auto">
            <a
              href={`tel:${BRAND.phonesE164[0]}`}
              className={`${TILE} hover:border-[var(--color-jade)]/40 hover:bg-[var(--color-jade-tint)]`}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-jade-tint)] transition-colors group-hover:bg-white">
                <Phone className="size-[18px] text-[var(--color-jade)]" aria-hidden />
              </span>
              <span className="text-[13px] font-medium leading-tight text-[var(--color-ink)]">
                Call now
              </span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
