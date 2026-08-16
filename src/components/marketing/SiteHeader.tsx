'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, UserRound, X } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Top navigation.
 *
 * Fixed, with the one permitted use of glassmorphism in this system: a
 * high-transparency Warm Ivory tint plus backdrop-blur, "to maintain a sense
 * of lightness as the user scrolls". Everything else in the design is opaque.
 *
 * The wordmark is Playfair at 24px with generous clear space, per the logo
 * guidance. The primary CTA is a sharp navy block — the only filled element
 * in the bar.
 */
export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="glass-nav fixed top-0 z-50 w-full border-b border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)]">
      <div className="shell flex h-20 items-center justify-between">
        <Link
          href="/"
          /* text-lg below sm: the wordmark is now the full "Astrologer Komal
             Kalra" (see BRAND in config.ts — Google's OAuth review requires a
             single unambiguous name), which overflows a 320px bar at 24px
             beside the mark and the menu button. */
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-[var(--color-cosmic-navy)] sm:text-2xl"
        >
          <Image src="/images/favicon.png" alt="" width={36} height={36} className="size-9" priority />
          {BRAND.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-base transition-colors duration-300',
                pathname.startsWith(item.href)
                  ? 'text-[var(--color-cosmic-navy)]'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-cosmic-navy)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/book"
            className="label-caps hidden items-center justify-center bg-[var(--color-cosmic-navy)] px-6 py-3.5 text-[var(--color-warm-ivory)] transition-colors duration-300 hover:bg-[var(--color-ink-black)] md:inline-flex"
          >
            Book Consultation
          </Link>

          <Link
            href={signedIn ? '/dashboard' : '/login'}
            aria-label={signedIn ? 'Your account' : 'Sign in'}
            className="text-[var(--color-cosmic-navy)] transition-transform duration-200 hover:scale-95"
          >
            <UserRound className="size-6" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="-mr-1 flex size-10 items-center justify-center text-[var(--color-cosmic-navy)] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] bg-[var(--color-warm-ivory)] md:hidden"
        >
          <nav aria-label="Mobile" className="shell py-6">
            <ul className="divide-y divide-[color-mix(in_srgb,var(--color-muted-gold)_15%,transparent)]">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-4 text-base text-[var(--color-cosmic-navy)]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/book"
              className="label-caps mt-6 flex items-center justify-center bg-[var(--color-cosmic-navy)] px-6 py-4 text-[var(--color-warm-ivory)]"
            >
              Book Consultation
            </Link>
            <a
              href={`tel:${BRAND.phonesE164[0]}`}
              className="label-caps mt-3 flex items-center justify-center border border-[var(--color-cosmic-navy)] px-6 py-4 text-[var(--color-cosmic-navy)]"
            >
              {BRAND.phones[0]}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
