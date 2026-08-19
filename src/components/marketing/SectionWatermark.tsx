import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Decorative brass Rashi Chakra disc, dropped into cream/sand-toned sections.
 * Alternate `corner` down the page (top-right, bottom-left, top-right, …) so
 * the discs zig-zag rather than stacking on the same side every time.
 *
 * `-z-10`, not `z-0` — an absolutely positioned element paints above static
 * content by default regardless of DOM order, so without a negative z-index
 * this would sit on top of the section's text. The parent section needs
 * `relative isolate overflow-hidden` (same pattern as the services-section
 * photo backdrop) so the negative z-index stays contained to that section
 * instead of dropping behind the section before it.
 */
export function SectionWatermark({ corner, className }: { corner: 'top-right' | 'bottom-left'; className?: string }) {
  const position = corner === 'top-right'
    ? 'top-0 right-0 -translate-y-1/3 translate-x-1/3'
    : 'bottom-0 left-0 translate-y-1/3 -translate-x-1/3';

  return (
    <Image
      src="/images/watermark-mark.webp"
      alt=""
      aria-hidden
      width={480}
      height={480}
      className={cn(
        'hero-watermark pointer-events-none absolute -z-10 size-[26rem] max-w-none object-contain opacity-[0.07]',
        position,
        className,
      )}
    />
  );
}
