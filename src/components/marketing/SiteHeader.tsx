'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Site header.
 *
 * Client component only because of the mobile menu and the scroll state — the
 * rest of the marketing pages stay server-rendered, so this is a small,
 * isolated island of JavaScript rather than a client-side page shell.
 *
 * The phone number sits in the header on desktop because Indian buyers in this
 * category frequently want a human before they pay, and burying the number
 * costs bookings (docs/research.md §1.3).
 */
export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation. Reset during render (React's
  // documented pattern for "adjusting state when a prop changes") rather than
  // in an effect, so there is no extra post-paint render where the menu is
  // still open on the new page.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-200',
        scrolled
          ? 'border-[var(--color-linen)] bg-[var(--color-sand)]/92 backdrop-blur-md'
          : 'border-transparent bg-[var(--color-sand)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[72px] lg:px-8">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-lg">
            Komal Kalra
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Astrologer · Counsellor
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'text-[var(--color-ember)]'
                  : 'text-[var(--color-bark)] hover:text-[var(--color-ink)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${BRAND.phonesE164[0]}`}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-bark)] transition-colors hover:text-[var(--color-ink)]"
          >
            <Phone className="size-3.5" aria-hidden />
            {BRAND.phones[0]}
          </a>
          <Button asChild size="sm">
            <Link href={signedIn ? '/dashboard' : '/book'}>
              {signedIn ? 'My dashboard' : 'Book a consultation'}
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 flex size-10 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink)] md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-[var(--color-linen)] bg-[var(--color-sand)] md:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-6xl px-5 py-4">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-[var(--radius-control)] px-3 py-3 text-[15px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-linen)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2.5 border-t border-[var(--color-linen)] pt-4">
              <Button asChild full size="lg">
                <Link href={signedIn ? '/dashboard' : '/book'}>
                  {signedIn ? 'My dashboard' : 'Book a consultation'}
                </Link>
              </Button>
              <Button asChild full variant="outline" size="lg">
                <a href={`tel:${BRAND.phonesE164[0]}`}>
                  <Phone aria-hidden /> {BRAND.phones[0]}
                </a>
              </Button>
              {!signedIn && (
                <Link
                  href="/login"
                  className="block py-2 text-center text-sm font-medium text-[var(--color-bark)]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
