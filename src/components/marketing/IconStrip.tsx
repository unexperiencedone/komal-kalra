import Link from 'next/link';
import { Timer, Sparkles, Waves, Handshake, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = [
  { href: '/services/astrological-guidance', label: 'Astrology', Icon: Timer },
  { href: '/services/life-coaching', label: 'Coaching', Icon: Sparkles },
  { href: '/services/healing-session', label: 'Healing', Icon: Waves },
  { href: '/services/counselling', label: 'Counselling', Icon: Handshake },
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
