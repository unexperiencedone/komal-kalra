'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { BRAND } from '@/lib/config';

/**
 * Persistent mobile CTA bar.
 *
 * Appears once the hero has scrolled out of view. This is the single
 * highest-leverage element on mobile for an appointment business — a visitor
 * who decides halfway down the page should never have to scroll to find the
 * button (docs/research.md §3.2).
 *
 * Mobile only: on desktop the header CTA is always visible, so a second fixed
 * bar would just be clutter.
 */
export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 620);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-linen)] bg-[var(--color-sand)]/96 backdrop-blur-md transition-transform duration-300 md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        <a
          href={`tel:${BRAND.phonesE164[0]}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-linen)] bg-white text-[var(--color-ink)]"
          aria-label={`Call ${BRAND.phones[0]}`}
          tabIndex={show ? 0 : -1}
        >
          <Phone className="size-4" aria-hidden />
        </a>
        <Link
          href="/book"
          tabIndex={show ? 0 : -1}
          className="flex h-12 flex-1 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-saffron)] text-[15px] font-semibold text-white"
        >
          Book a consultation
        </Link>
      </div>
    </div>
  );
}
