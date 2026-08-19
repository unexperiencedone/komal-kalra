'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { serviceImage } from '@/lib/content/imagery';
import type { Service } from '@/types/database';

/**
 * Resting rotation per card. Small on purpose — on the reference the row reads
 * as an even upright line with a hint of variation, not scattered polaroids.
 */
const RESTING_TILT_DEG = [-2, 1.5, -1, 2, -1.5];

/** How far the cursor-follow tilt swings from resting, edge to edge. */
const HOVER_SWING_DEG = 16;

/**
 * Progress of the pinned stage, 0 → 1.
 *
 * WHY THIS EXISTS
 *
 * Pinning a hero and then doing nothing while it is pinned is the worst of
 * both worlds: the reader scrolls, the screen does not move, and it reads as a
 * broken page. The pin has to buy something. Here it buys the card row rising
 * and fanning open as you scroll through the reserved distance.
 *
 * Measured from the `.pin-stage` ancestor rather than the row itself, because
 * the row is inside the *pinned* element — its own bounding rect barely moves,
 * which is exactly the point of pinning. The stage is what scrolls.
 *
 * rAF-throttled: `getBoundingClientRect` forces layout, and calling it
 * directly in a scroll handler reflows on every event.
 */
function usePinProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const stage = ref.current?.closest<HTMLElement>('.pin-stage');
    if (!stage) return;

    // Reduced motion: settle straight to the open state and attach nothing.
    // Deferred to a task rather than set synchronously in the effect body —
    // a synchronous setState here cascades an extra render on every mount.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const settle = window.setTimeout(() => setProgress(1), 0);
      return () => window.clearTimeout(settle);
    }

    const measure = () => {
      frame.current = 0;
      const rect = stage.getBoundingClientRect();
      // Distance actually travelled through the stage, over the distance
      // available. Clamped so it settles at both ends instead of overshooting.
      const travelled = -rect.top;
      const available = rect.height - window.innerHeight;
      if (available <= 0) return setProgress(1);
      setProgress(Math.min(1, Math.max(0, travelled / available)));
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [ref]);

  return progress;
}

function ServiceTiltCard({
  service,
  index,
  count,
  progress,
  dimmed,
  onHover,
}: {
  service: Service;
  index: number;
  count: number;
  progress: number;
  dimmed: boolean;
  onHover: (index: number | null) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const resting = RESTING_TILT_DEG[index % RESTING_TILT_DEG.length];
  const [swing, setSwing] = useState(0);
  const [hovering, setHovering] = useState(false);

  const photo = serviceImage(service.slug);

  const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    setSwing(relativeX * HOVER_SWING_DEG);
  };

  /**
   * SCROLL-DRIVEN FAN.
   *
   * At progress 0 the row is a tight, flat stack — every card sits low, close
   * to centre, barely rotated. As the stage scrolls the cards rise, spread
   * outward from the middle and rotate away from it, so the row opens like a
   * hand of cards.
   *
   * `offset` is -1 at the leftmost card, +1 at the rightmost, 0 in the middle,
   * which is what makes the spread symmetrical regardless of how many services
   * exist.
   */
  const offset = count > 1 ? (index / (count - 1)) * 2 - 1 : 0;
  const rise = (1 - progress) * 96;
  const spread = offset * progress * 14;
  const fan = offset * progress * 5;
  const settle = 0.94 + progress * 0.06;

  const transform = [
    `translate3d(${spread}px, ${rise}px, 0)`,
    `rotate(${resting + fan + swing}deg)`,
    `scale(${(hovering ? 1.06 : 1) * settle})`,
  ].join(' ');

  return (
    <Link
      ref={ref}
      href={`/services/${service.slug}`}
      onMouseMove={handleMove}
      onMouseEnter={() => {
        setHovering(true);
        onHover(index);
      }}
      onMouseLeave={() => {
        setHovering(false);
        setSwing(0);
        onHover(null);
      }}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      style={{
        transform,
        // Entrance stagger. Cards arrive left to right rather than all at once,
        // which is the whole difference between "appeared" and "dealt".
        transitionDelay: `${index * 60}ms`,
        opacity: dimmed ? 0.55 : 1,
      }}
      className="group relative block aspect-[3/4] w-48 shrink-0 snap-center overflow-hidden rounded-[28px] border border-[var(--color-hairline)] shadow-[0_20px_45px_-20px_rgba(45,20,5,0.5)] transition-[transform,opacity,filter] duration-500 ease-out will-change-transform motion-reduce:transition-none sm:w-56 md:h-full md:w-auto md:shrink"
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 768px) 22vw, 240px"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
      />

      {/* Two scrims: the bottom row needs contrast along the lower edge, the
          vertical title along the right. One gradient cannot do both without
          washing out the photograph. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-black/55 via-transparent to-transparent" />

      {/* Title on the vertical axis, reading bottom-to-top — the spine-label
          treatment from the reference, not a flat caption. */}
      <h3 className="absolute inset-y-4 right-3 z-10 flex items-center [writing-mode:vertical-rl] rotate-180 font-[family-name:var(--font-display)] text-lg font-medium leading-none tracking-wide text-white lg:text-xl">
        {service.title}
      </h3>

      <div className="relative z-10 flex h-full flex-col justify-between p-4 pr-11 text-white">
        <span className="label-small opacity-80">0{index + 1}</span>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1 text-xs opacity-90">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {service.duration_minutes} min
            </span>
            <span>{formatPaise(service.price_paise)}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {service.bookable_online ? 'Explore' : 'Enquire'}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * The pinned hero's card row.
 *
 * Three interactions, in order of how much they matter:
 *
 *  1. SCROLL FAN — the row rises and spreads as the pinned stage scrolls. This
 *     is what justifies pinning at all; a pinned screen that does not respond
 *     to scrolling reads as frozen.
 *  2. SIBLING RECEDE — pointing at one card fades the others. It is the
 *     cheapest way to make a row of equals feel like a gallery, and it costs
 *     one piece of state.
 *  3. CURSOR TILT — the card leans toward whichever side the cursor is on.
 *
 * All three are transform/opacity only, and all three are disabled or settled
 * under `prefers-reduced-motion`.
 */
export function ServiceTiltGallery({ services }: { services: Service[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const progress = usePinProgress(rowRef);
  const [hovered, setHovered] = useState<number | null>(null);

  if (services.length === 0) return null;

  return (
    <div
      ref={rowRef}
      className="flex snap-x snap-mandatory flex-nowrap items-end gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-full md:justify-center md:overflow-visible md:px-0 md:pb-0 lg:gap-6"
    >
      {services.map((service, index) => (
        <ServiceTiltCard
          key={service.id}
          service={service}
          index={index}
          count={services.length}
          progress={progress}
          dimmed={hovered !== null && hovered !== index}
          onHover={setHovered}
        />
      ))}
    </div>
  );
}
