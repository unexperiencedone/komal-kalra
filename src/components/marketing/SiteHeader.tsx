'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/services', label: 'Consultation' },
  { href: '/free-tools', label: 'Free Tools' },
  { href: '/about', label: 'About Komal' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Hide the bar on scroll down, bring it back on scroll up.
 *
 * The header is 8rem tall on desktop — two rows — which is a lot of a phone
 * screen to give up permanently. Hiding it while the reader is moving forward
 * and returning it the instant they reverse gives back the space without
 * making them scroll to the top to navigate.
 *
 * Three details that matter:
 *
 *  • The reads happen inside rAF. `scrollY` is a layout-triggering read, and
 *    doing it directly in a scroll handler forces a reflow on every event.
 *  • A 6px threshold, because trackpads and touch momentum emit tiny
 *    alternating deltas that would otherwise flicker the bar continuously.
 *  • It never hides in the top 120px, so the header is always present at the
 *    top of a page regardless of which direction the last scroll went.
 */
function useHideOnScroll(active: boolean) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!active) {
      const reveal = window.setTimeout(() => setHidden(false), 0);
      return () => window.clearTimeout(reveal);
    }

    lastY.current = window.scrollY;

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (Math.abs(delta) < 6) return;
        setHidden(y > 120 && delta > 0);
        lastY.current = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active]);

  return hidden;
}

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Never auto-hide while the mobile menu is open — the close button lives in
  // the bar, and sliding it off screen would trap the user in the overlay.
  const hidden = useHideOnScroll(!open);

  useEffect(() => {
    const close = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(close);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header
      className={cn(
        // sticky, not fixed — see the note in (marketing)/layout.tsx. Fixed
        // required a hardcoded pt- on <main> to compensate, and that padding
        // showed the cream page background as a stripe under the header.
        //
        // No border-b either. Every page's first section is terracotta, the
        // same value as this bar, so the two are meant to read as one block.
        // A hairline there just reintroduces the seam in a subtler form.
        'sticky top-0 z-50 w-full bg-[var(--color-terracotta-lo)] text-[var(--color-cream)]',
        'transition-transform duration-300 ease-out motion-reduce:transition-none',
        hidden && !open ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className="shell relative flex min-h-20 flex-col">
        <div className="flex min-h-20 items-center justify-between border-b border-[color-mix(in_srgb,var(--color-cream)_22%,transparent)]">
          <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)] text-xl sm:text-2xl uppercase tracking-[0.15em] text-[var(--color-cream)]"
        >
          Komal Kalra
          </Link>

          <div className="flex items-center gap-4">
            <Link href={signedIn ? '/dashboard' : '/login'} className="hidden text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-cream)] hover:text-[var(--color-saffron-lift)] md:inline-flex">Login</Link>
            <Button variant="primary" asChild className="hidden bg-[var(--color-saffron)] text-[var(--color-on-saffron)] shadow-[4px_4px_0_0_var(--color-on-saffron)] hover:bg-[var(--color-saffron-lift)] md:inline-flex">
              <Link href="/book">Join Community</Link>
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="relative z-[70] flex size-10 items-center justify-center text-[var(--color-cream)] md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="hidden items-center justify-center gap-8 py-3 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm transition-colors duration-300',
                pathname.startsWith(item.href)
                  ? 'text-[var(--color-saffron-lift)]'
                  : 'text-[var(--color-cream)] hover:text-[var(--color-saffron-lift)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-[60] min-h-[calc(100dvh-5rem)] overflow-y-auto bg-[var(--color-terracotta-lo)] md:hidden"
        >
          <nav aria-label="Mobile" className="shell py-6 flex flex-col min-h-[calc(100dvh-5rem)]">
            <ul className="flex-1 divide-y divide-[color-mix(in_srgb,var(--color-cream)_30%,transparent)]">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-4 text-2xl font-[family-name:var(--font-display)] text-[var(--color-cream)]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pb-8">
              <Button variant="primary" asChild className="w-full bg-[var(--color-cream)] text-[var(--color-cocoa)] hover:bg-[var(--color-card-cream)] shadow-none mb-4">
                <Link href="/book">Book Consultation</Link>
              </Button>
              <a
                href={`tel:${BRAND.phonesE164[0]}`}
                className="label-caps flex items-center justify-center border border-[var(--color-cream)] px-6 py-4 text-[var(--color-cream)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-cocoa)]"
              >
                {BRAND.phones[0]}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
