import Link from 'next/link';
import { Timer, Sparkles, Waves, GitCompareArrows, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Four ways in, plus contact.
 *
 * These pointed at the old topic services (Astrological Guidance, Life
 * Coaching, Healing, Counselling) until database/36_consultation_catalogue.sql
 * replaced the placeholder catalogue with the practice's real fee sheet. The
 * labels stay short and plain — they are a wayfinding strip, not a price list —
 * and each now lands on the consultation it names.
 */
const ICONS = [
  { href: '/services/consultation-30-sunil', label: '30 Minutes', Icon: Timer },
  { href: '/services/consultation-40', label: '40 Minutes', Icon: Sparkles },
  { href: '/services/in-depth-kundli', label: 'In-Depth Kundli', Icon: GitCompareArrows },
  { href: '/services/family-pack', label: 'Family Pack', Icon: Waves },
  { href: '/contact', label: 'Contact', Icon: Mail },
];

/**
 * `sand`, not `cream`.
 *
 * It was cream, and it now sits directly above the cream "Meet Our Astrologers"
 * band — two identical bands meeting with no seam, which reads as one
 * over-long section. `npm run audit:bands` catches exactly this.
 *
 * The tone is hardcoded rather than passed in, deliberately: this component has
 * one call site, and the audit works by reading `band-*` classes out of the
 * source. A tone prop would hide the real value behind a default and leave the
 * check unable to see what actually renders — trading a verifiable fact for
 * flexibility nothing is asking for.
 */
export function IconStrip({ className }: { className?: string }) {
  return (
    <section className={cn("band-sand py-8 md:py-12", className)}>
      <div className="shell">
        <ul className="flex flex-wrap justify-center gap-6 md:gap-12">
          {ICONS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="group flex flex-col items-center gap-3">
                <span className="flex items-center justify-center size-16 md:size-20 rounded-full border border-[var(--color-saffron)] bg-transparent transition-colors duration-300 group-hover:bg-[var(--color-card-cream)]">
                  <Icon className="size-6 md:size-8 text-[var(--color-saffron)]" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-medium text-[var(--color-cocoa)] tracking-wide">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
