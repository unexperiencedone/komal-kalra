'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * Rashi Chakra watermark — fixed to the viewport, rotating as the page scrolls.
 *
 * HOW THE ROTATION IS DRIVEN
 *
 * Primary path is a NATIVE CSS scroll-driven animation (`animation-timeline:
 * scroll(root block)`). It runs on the compositor, costs zero JavaScript, and
 * cannot jank the main thread — which matters because this element is on screen
 * for the entire page and any scroll-linked JS runs on every single frame.
 *
 * The `useEffect` below is a FALLBACK, and it only attaches a listener when the
 * browser lacks that support. Where support exists this component ships no
 * runtime work at all.
 *
 * The fallback itself is rAF-coalesced: the scroll handler only records a
 * position and requests a frame, so multiple scroll events between paints
 * collapse into one write. Writing `transform` directly inside a scroll handler
 * is the usual way this pattern ends up dropping frames.
 *
 * ACCESSIBILITY
 *  - Purely decorative: `aria-hidden`, empty alt, `pointer-events: none`. It is
 *    never in the accessibility tree or the tab order.
 *  - `prefers-reduced-motion` stops the rotation entirely. A slowly spinning
 *    element in the periphery is exactly the kind of thing that triggers
 *    vestibular symptoms, and it carries no information, so it simply holds
 *    still.
 *
 * CONTRAST
 * At 6% opacity over Warm Ivory the mark sits far below any text it passes
 * behind, so it cannot affect the contrast ratios the audit enforces. It is
 * also `select-none` so it never interferes with copying text.
 */
export function ScrollWatermark({
  /** Full rotation across one viewport-height of scroll, in degrees. */
  degreesPerViewport = 90,
  /** Opacity of the mark. Deliberately a prop so it is tunable in one place. */
  opacity = 0.06,
}: {
  degreesPerViewport?: number;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Native scroll timelines handle it — do nothing.
    const hasScrollTimeline =
      typeof CSS !== 'undefined' &&
      CSS.supports?.('animation-timeline: scroll()');
    if (hasScrollTimeline) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    let frame = 0;
    let latest = window.scrollY;

    const paint = () => {
      frame = 0;
      const perPx = degreesPerViewport / Math.max(1, window.innerHeight);
      node.style.transform = `rotate(${latest * perPx}deg)`;
    };

    const onScroll = () => {
      latest = window.scrollY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [degreesPerViewport]);

  return (
    <div
      aria-hidden
      /*
        z-index: -1, NOT 0.
        A positioned element with z-index 0 paints in step 6 of the stacking
        order — ABOVE block backgrounds and above inline text. At z-0 this mark
        would render on top of every paragraph on the page. At -1 it paints in
        step 2: above the <body> background, below all content.
        The trade-off is that any section with its own opaque background will
        hide it, which is why the homepage's ivory sections are transparent —
        band-ivory is the same colour as the body, so dropping it changes
        nothing visually except letting the mark through.
      */
      className="pointer-events-none fixed inset-0 -z-10 flex select-none items-center justify-center overflow-hidden"
      style={{ opacity }}
    >
      <div
        ref={ref}
        className="watermark-scrub relative aspect-square w-[130vmin] will-change-transform"
      >
        <Image
          src="/images/watermark-mark.webp"
          alt=""
          fill
          sizes="130vmin"
          priority={false}
          className="object-contain"
        />
      </div>
    </div>
  );
}
