'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useT } from '@/lib/i18n/LanguageProvider';

/**
 * Labels are translation KEYS, not text. The dictionary is the single place
 * both languages live, so a nav item cannot exist in one language only.
 */
const NAV = [
  { href: '/services', key: 'nav.consultation' },
  { href: '/free-tools', key: 'nav.freeTools' },
  { href: '/about', key: 'nav.about' },
  { href: '/faq', key: 'nav.faq' },
  { href: '/contact', key: 'nav.contact' },
] as const;

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

/**
 * No `signedIn` prop. Working it out required a cookie read in the marketing
 * layout, which broke prerendering of /services/[slug] — see the note there.
 * /login sends a signed-in visitor onward, so this link is correct either way.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

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
        <div className="flex min-h-20 items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--color-cream)_22%,transparent)]">
          {/*
            IN FLOW ON MOBILE, absolutely centred only from md up.

            This was `absolute left-1/2 -translate-x-1/2` at every width, so the
            wordmark was taken out of the layout and centred over a flex row
            that still believed it had the whole bar to itself. On a phone that
            put the logo, the language toggle and the hamburger in the same
            physical space, all overlapping.

            Centring a mark over other controls only works when there is room
            for both, which there is not at 375px — so below md it becomes an
            ordinary flex child and `justify-between` does the work.
          */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-display)] uppercase text-[var(--color-cream)] md:absolute md:left-1/2 md:-translate-x-1/2"
          >
            <Image
              src="/images/favicon_new.png"
              alt=""
              width={40}
              height={40}
              className="size-8 shrink-0 object-contain sm:size-10"
            />
            {/* BRAND.wordmark, not BRAND.name — see the note on that constant. */}
            <span className="min-w-0 text-base leading-[1.15] tracking-[0.12em] sm:text-xl sm:tracking-[0.15em] md:whitespace-nowrap md:text-2xl">
              {BRAND.wordmark}
            </span>
          </Link>

          {/* ml-auto so this stays right-aligned at md+, where the wordmark
              leaves the flow and is no longer the flex partner. */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Visible on mobile too: the audience most likely to want Punjabi
                is not the one most likely to be on a desktop. */}
            <LanguageToggle className="border-[color-mix(in_srgb,var(--color-cream)_35%,transparent)]" />
            {/*
              One call to action, and it names what it does.
              "Join Community" promised something this site does not have, and
              "Login" sat beside it competing for the same click while being
              useless to a first-time visitor — nobody arriving to book a
              consultation has an account.

              /login still works by direct URL, which is how Komal reaches the
              admin console. Removing the link removes a dead end for clients,
              not the route.
            */}
            <Button variant="primary" asChild className="hidden bg-[var(--color-saffron)] text-[var(--color-on-saffron)] shadow-[4px_4px_0_0_var(--color-on-saffron)] hover:bg-[var(--color-saffron-lift)] md:inline-flex">
              <Link href="/book">{t('nav.book')}</Link>
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
              {t(item.key)}
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
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pb-8">
              <Button variant="primary" asChild className="w-full bg-[var(--color-cream)] text-[var(--color-cocoa)] hover:bg-[var(--color-card-cream)] shadow-none mb-4">
                <Link href="/book">{t('nav.book')}</Link>
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
