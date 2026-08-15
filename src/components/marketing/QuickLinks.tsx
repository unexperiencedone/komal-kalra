import Link from 'next/link';
import { CalendarDays, HeartHandshake, MessageCircleQuestion, Phone, Users } from 'lucide-react';
import { BRAND } from '@/lib/config';

/**
 * Quick-access strip, directly under the hero.
 *
 * Adapted from the reference site's icon row. Two changes:
 *
 *  1. FIVE tiles, not eight. The reference's row mixes primary actions with
 *     cross-sells to separate businesses (gemstones, courses), which dilutes
 *     the one thing this page is for.
 *  2. Every tile is a genuine destination in this product. No tile advertises
 *     something that does not exist.
 *
 * Horizontally scrollable on mobile with snap points — this sits immediately
 * below the fold on a phone and is the first thing a returning visitor reaches
 * for.
 */
const LINKS = [
  { href: '/book', label: 'Book a session', icon: CalendarDays },
  { href: '/services/kundli-milan', label: 'Kundli Milan', icon: HeartHandshake },
  { href: '/services', label: 'All services', icon: Users },
  { href: '/contact', label: 'Ask a question', icon: MessageCircleQuestion },
] as const;

export function QuickLinks() {
  return (
    <nav
      aria-label="Quick links"
      className="border-b border-[var(--color-linen)] bg-white"
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-5 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-0">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href} className="w-[132px] shrink-0 snap-start sm:w-auto">
              <Link
                href={href}
                className="group flex h-full flex-col items-center gap-2.5 rounded-[var(--radius-card)] border border-[var(--color-linen)] px-3 py-4 text-center transition-colors hover:border-[var(--color-saffron)]/50 hover:bg-[var(--color-saffron-tint)]"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-saffron-tint)] transition-colors group-hover:bg-white">
                  <Icon className="size-4 text-[var(--color-ember)]" aria-hidden />
                </span>
                <span className="text-[13px] font-medium leading-tight text-[var(--color-ink)]">
                  {label}
                </span>
              </Link>
            </li>
          ))}

          {/* Phone is an <a>, not a Link — it is a tel: handoff, not a route. */}
          <li className="w-[132px] shrink-0 snap-start sm:w-auto">
            <a
              href={`tel:${BRAND.phonesE164[0]}`}
              className="group flex h-full flex-col items-center gap-2.5 rounded-[var(--radius-card)] border border-[var(--color-linen)] px-3 py-4 text-center transition-colors hover:border-[var(--color-saffron)]/50 hover:bg-[var(--color-saffron-tint)]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-saffron-tint)] transition-colors group-hover:bg-white">
                <Phone className="size-4 text-[var(--color-ember)]" aria-hidden />
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
