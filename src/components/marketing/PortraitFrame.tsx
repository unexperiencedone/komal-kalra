'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Photograph with the offset gold frame, animated on first view.
 *
 * THE INTERACTION
 * On reveal the frame slides from flush with the image out to its offset
 * position, as if being set down beside it. On hover the image scales very
 * slightly (1.03) and the frame drifts a further 2px — enough to feel alive,
 * far short of the "everything moves" register that would fight the Silent
 * Luxury brief.
 *
 * WHY IT ANIMATES ONCE
 * The observer disconnects after firing. A frame that re-animates every time it
 * scrolls back into view is the single most common way a tasteful entrance
 * effect becomes irritating on a second read.
 *
 * MOTION SAFETY
 * Under `prefers-reduced-motion` the component renders in its final state
 * immediately and attaches no observer — the frame is simply already offset.
 * Nothing is lost, because the animation carries no information.
 *
 * PERFORMANCE
 * Only `transform` and `opacity` are animated, both of which the compositor
 * handles without layout or paint. `object-position` is exposed because these
 * are square source images placed in 4/5 and 3/2 crops, and the default centre
 * crop cuts the subject's head off.
 */
export function PortraitFrame({
  src,
  alt,
  priority = false,
  aspect = 'portrait',
  objectPosition = '50% 35%',
  sizes = '(min-width: 768px) 40vw, 100vw',
  className,
  frameOffset = 16,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  aspect?: 'portrait' | 'landscape' | 'square';
  /** Square sources in a tall crop need the focal point above centre. */
  objectPosition?: string;
  sizes?: string;
  className?: string;
  /** How far the gold rule sits down and right of the image, in px. */
  frameOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced motion, or no observer: render the resting state at once.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      const reveal = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(reveal);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect(); // fire once, never again
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ratio = {
    portrait: 'aspect-[4/5]',
    landscape: 'aspect-[3/2]',
    square: 'aspect-square',
  }[aspect];

  return (
    <div ref={ref} className={cn('group relative', ratio, className)}>
      <div className="relative size-full overflow-hidden bg-[var(--color-cream)]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          style={{ objectPosition }}
          className={cn(
            'object-cover transition-transform duration-[900ms] ease-[var(--ease-out-quint)]',
            'motion-safe:group-hover:scale-[1.03]',
            shown ? 'scale-100' : 'scale-[1.06]',
          )}
        />
      </div>

      {/* Offset gold rule. Starts flush with the image and settles outward. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 border border-[var(--color-hairline)] transition-transform duration-[900ms] ease-[var(--ease-out-quint)] motion-safe:group-hover:translate-x-[var(--frame-hover)] motion-safe:group-hover:translate-y-[var(--frame-hover)]"
        style={
          {
            transform: shown ? `translate(${frameOffset}px, ${frameOffset}px)` : 'translate(0, 0)',
            '--frame-hover': `${frameOffset + 3}px`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
