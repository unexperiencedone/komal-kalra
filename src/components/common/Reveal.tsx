'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Entrance animation on first scroll into view.
 *
 * Deliberately CSS + IntersectionObserver rather than Framer Motion: this is
 * used on the marketing pages, and shipping an animation library to the
 * critical path to fade in a heading is exactly the trade the performance
 * research warns against. Framer Motion is reserved for the booking flow, where
 * shared-layout transitions genuinely need it.
 *
 * Fires ONCE and disconnects. Re-firing on every scroll is the single most
 * common reason a site feels like a template.
 *
 * `prefers-reduced-motion` is handled in globals.css, where `.reveal` resolves
 * to its final state with no transition.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  // Typed as HTMLDivElement and cast at the JSX boundary. A genuinely
  // polymorphic ref type here would cost more in generics than the component is
  // worth — every allowed tag is an HTMLElement and the observer only needs
  // that much.
  const ref = useRef<HTMLDivElement>(null);
  // Must start `false` on both server and client: the server never has
  // IntersectionObserver, so seeding this from `typeof IntersectionObserver`
  // makes the very first client render disagree with the SSR output and
  // React refuses to patch up the resulting hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      // No observer support post-mount (not the SSR case above) — reveal
      // immediately rather than leaving the content permanently hidden.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- capability fallback, not derivable at render time without breaking hydration above
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: visible && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Component>
  );
}
