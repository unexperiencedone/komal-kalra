'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { serviceImage } from '@/lib/content/imagery';
import type { Service } from '@/types/database';

/**
 * ALL ROTATION HERE IS rotateY — around the vertical axis, turning the card in
 * depth like a door — NOT `rotate()`, which spins it flat in the page plane.
 *
 * Two things this depends on, both on the ROW rather than the card:
 *
 *  • `perspective`. Without it `rotateY` is an orthographic squash: the card
 *    just gets narrower, with no near edge and no far edge. Perspective is what
 *    supplies the vanishing point that makes it read as depth.
 *  • `perspective` must sit on the PARENT. Put it on each card and every card
 *    gets its own vanishing point directly in front of itself, so they all
 *    turn identically and the row looks flat. One perspective on the row means
 *    they share a single viewpoint, and cards away from centre catch it at an
 *    angle — which is what makes the fan read as a real arc.
 *
 * Angles stay modest. rotateY foreshortens, so past roughly 25° a card loses
 * enough width to look broken rather than turned, and text on it starts to
 * render soft.
 */

/**
 * THE FAN IS DERIVED FROM POSITION, NOT LISTED PER CARD.
 *
 * This used to be a hardcoded array of angles cycled by index — `[-6, 4, -2,
 * 5, -4]`. That is why the row looked uneven: the angles bore no relation to
 * where a card actually sat, so the third card might lean harder than the
 * fifth, and because rotateY foreshortens, a card turned further also renders
 * NARROWER. Cards that were all genuinely the same width read as different
 * widths. Arbitrary angles cannot be symmetrical by accident.
 *
 * Now every angle comes from one number: how far the card is from the middle
 * of the row. The centre card is 0 — upright, facing straight ahead, widest —
 * and the turn grows toward both ends, mirrored. That is symmetric for any
 * number of services, including even counts where no single card is the
 * middle, and it is what makes the row read as one arc rather than five
 * separate decisions.
 */

/** Turn at the outermost card, degrees on Y. The centre card is always 0. */
const FAN_BASE_DEG = 9;

/** Extra turn the outermost card gains as the pinned stage scrolls open. */
const FAN_OPEN_DEG = 12;

/** How much higher the centre card sits than the ends, in px. */
const ARC_LIFT_PX = 34;

/** How far the cursor-follow turn swings from the card's fan angle. */
const HOVER_SWING_DEG = 20;

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
  /**
   * ⚠️  THIS REF IS ON THE UNTRANSFORMED WRAPPER, NOT THE ROTATING CARD.
   *    Moving it back onto the card breaks hover. Here is why.
   *
   * `getBoundingClientRect()` returns the rect AFTER transforms. Reading it
   * from the element that is being rotated means measuring a moving target:
   *
   *    mousemove → compute angle from the card's current rect
   *              → card rotates and shifts
   *              → its rect is now different, and the cursor may no longer be
   *                over it at all
   *              → mouseleave fires, swing resets to 0
   *              → card springs back under the cursor
   *              → mouseenter fires …
   *
   * That loop is what "the hover animation is not being triggered, something
   * is interrupting it" actually is: enter and leave firing against each other
   * several times a second, so the hover state never survives long enough to
   * be seen. It gets worse the larger the tilt, which is why it appeared only
   * after the angles went up.
   *
   * The wrapper never moves, so the rect is stable, the pointer target is
   * stable, and the angle is measured against a fixed frame of reference.
   */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [swing, setSwing] = useState(0);
  const [hovering, setHovering] = useState(false);

  const photo = serviceImage(service.slug);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    setSwing(relativeX * HOVER_SWING_DEG);
  };

  /**
   * SCROLL-DRIVEN FAN.
   *
   * At progress 0 the row is a tight, low, nearly-flat stack. As the stage
   * scrolls the cards rise, spread outward from the middle and turn away from
   * it, so the row opens like a hand of cards.
   *
   * `offset` is -1 at the leftmost card, +1 at the rightmost, 0 in the middle.
   * Every placement value below is a function of it, which is what guarantees
   * the row is mirrored however many services exist.
   */
  const offset = count > 1 ? (index / (count - 1)) * 2 - 1 : 0;

  /**
   * Sign matters and is easy to get backwards.
   *
   * Positive `rotateY` turns a card's RIGHT edge away from the viewer, so the
   * card ends up facing LEFT. The left-hand cards have a negative `offset`, so
   * `-offset` makes them positive → they face left. The right-hand cards get a
   * negative angle → they face right. The fan opens OUTWARD from the middle.
   *
   * Flip this sign and the row turns inward like a closing book, which looks
   * like a bug rather than a choice.
   */
  const fanDeg = -offset * (FAN_BASE_DEG + progress * FAN_OPEN_DEG);

  /**
   * ARRIVAL STATE — the arc is MOSTLY FORMED AT progress 0.
   *
   * These used to be multiplied by `progress` alone, so at progress 0 — which
   * is what you see the instant the page loads — the arc was flat, the spread
   * was zero and a separate `rise` pushed the whole row 96px down. The first
   * thing a visitor saw was the row in its least interesting state, half off
   * the bottom of the screen, and it only assembled if they happened to scroll.
   *
   * An entrance you have to scroll to trigger is not an entrance. The arc is
   * now 65% formed on arrival and opens the rest of the way as the pin
   * scrolls, so the composition is right on the first frame and scrolling
   * refines it rather than creating it.
   */
  const formed = 0.65 + 0.35 * progress;

  /** Centre highest, ends lowest — `1 - |offset|` peaks in the middle. */
  const arc = -(1 - Math.abs(offset)) * ARC_LIFT_PX * formed;

  /** Ends push outward as it opens, so the arc widens rather than just
      rotating in place. */
  const spread = offset * formed * 16;

  // Hovering flattens the card back toward the viewer. Turning it further
  // would fight the cursor tilt; facing the reader rewards the attention.
  const flatten = hovering ? 0.3 : 1;
  const settle = 0.94 + progress * 0.06;

  /**
   * THE TRANSFORM IS SPLIT ACROSS TWO ELEMENTS. Do not recombine it.
   *
   *   wrapper → translate + scale   (moves the whole card, text included)
   *   plate   → rotateY             (turns only the photograph)
   *
   * Putting all of it on the plate detached the card from its own caption: the
   * plate slid sideways with `spread` and lifted with `arc` while the text,
   * which lives in the untransformed wrapper, stayed exactly where it was. The
   * result was five photographs with their prices floating off to one side.
   *
   * Splitting it means the text travels with the card — it is inside the
   * element carrying the positional transform — but is never rotated, so
   * `rotateY` cannot shear it.
   *
   * It also keeps the hover fix intact, which is the subtle part. The
   * oscillation came from measuring a rect that changed WHILE THE CURSOR MOVED,
   * and the only cursor-driven value is `swing` — a rotation, now confined to
   * the plate. `spread`, `arc` and `settle` depend on scroll position alone and
   * `scale` on a boolean, so the wrapper's rect is stable throughout a
   * mousemove. Scaling up on enter is safe for the same reason: the card grows
   * around the cursor rather than out from under it.
   */
  const wrapperTransform = [
    `translate3d(${spread}px, ${arc}px, 0)`,
    `scale(${(hovering ? 1.06 : 1) * settle})`,
  ].join(' ');

  const plateTransform = `rotateY(${fanDeg * flatten + swing}deg)`;

  return (
    <div
      ref={wrapRef}
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
      style={{ transform: wrapperTransform, opacity: dimmed ? 0.55 : 1 }}
      /*
        Carries the card's POSITION (translate + scale) and everything that has
        to travel with it, the text included. It never rotates, so the rect the
        pointer is measured against does not change mid-mousemove.

        `preserve-3d` matters: the perspective lives on the ROW, and perspective
        only applies to its DIRECT children. Without this the plate's `rotateY`
        would be a grandchild of that perspective and would render as a flat
        horizontal squash with no depth at all.

        `md:min-w-[8rem]` is a collapse guard, not a design choice. The width at
        md+ is intrinsic — it comes from the in-flow text block below — so any
        future change that empties this wrapper of flow content would silently
        take every card to zero width again, which is exactly what happened
        once. A floor means that failure shows as cards that are too narrow
        rather than a page with no cards on it.
      */
      className="group relative aspect-[3/4] w-48 shrink-0 snap-center [transition:transform_320ms_var(--ease-out-quint),opacity_400ms_ease-out] will-change-transform motion-reduce:transition-none sm:w-56 md:h-full md:w-auto md:min-w-[8rem] md:shrink md:[transform-style:preserve-3d]"
    >
      <Link
        href={`/services/${service.slug}`}
        aria-label={`${service.title} — ${service.duration_minutes} minutes, ${formatPaise(service.price_paise)}`}
        onFocus={() => {
          setHovering(true);
          onHover(index);
        }}
        onBlur={() => {
          setHovering(false);
          onHover(null);
        }}
        style={{ transform: plateTransform }}
      /*
        TWO DURATIONS, NOT ONE.

        `transform` is recomputed every animation frame by the scroll fan and
        again on every mousemove by the cursor tilt. A 500ms transition on a
        value that already changes per frame does not smooth it — it adds half
        a second of lag behind the cursor and makes the fan trail the scroll.
        120ms is enough to take the edge off without the card feeling detached
        from the pointer.

        `opacity` is the opposite case: it changes once, when a sibling is
        pointed at, so it wants a slow fade.

        There is also no transition-delay here any more. Staggering a property
        that updates continuously means each card lags the scroll by a
        different amount, which reads as jank rather than choreography — the
        fan's own per-card offset already provides the stagger.
      */
        /*
          The PLATE — the only transformed element. Holds the photograph and
          the scrims and nothing else.

          Two durations, not one. `transform` is recomputed every animation
          frame by the scroll fan and again on every mousemove by the cursor
          tilt; a 500ms transition on a value that already changes per frame
          does not smooth it, it just adds half a second of lag behind the
          pointer. `opacity` changes once, when a sibling is pointed at, so it
          wants the slow fade.
        */
        className="absolute inset-0 block overflow-hidden rounded-[28px] border border-[var(--color-hairline)] shadow-[0_20px_45px_-20px_rgba(45,20,5,0.5)] [transition:transform_120ms_ease-out,opacity_400ms_ease-out] will-change-transform motion-reduce:transition-none"
      >
        <Image
          src={photo.src}
          alt=""
          fill
          sizes="(min-width: 768px) 22vw, 240px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />

        {/* Two scrims: the bottom row needs contrast along the lower edge, the
            vertical title along the right. One gradient cannot do both without
            washing out the photograph. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-black/55 via-transparent to-transparent" />
      </Link>

      {/*
        TEXT LIVES OUTSIDE THE ROTATION.

        It used to sit inside the plate, so `rotateY` foreshortened it along
        with the photograph — the vertical title sheared, the digits went soft,
        and at the outer cards the type looked bent rather than turned. Text is
        the one thing on a card that must stay square to the reader.

        It cannot be counter-rotated back either: the plate carries
        `overflow: hidden` for the rounded crop, and any overflow other than
        `visible` forces the browser to flatten `preserve-3d`, so a child's
        `rotateY(-angle)` would not compose in 3D. Keeping the text in the
        untransformed wrapper is the fix that actually works.

        `pointer-events-none` so clicks fall through to the link underneath,
        and `aria-hidden` because the link already carries all of this in its
        accessible name — otherwise a screen reader reads the card twice.
      */}
      {/* The vertical spine title. Absolute is fine here — the block below is
          what gives the wrapper its size. */}
      <h3
        aria-hidden
        className="pointer-events-none absolute inset-y-4 right-3 z-10 flex items-center [writing-mode:vertical-rl] rotate-180 font-[family-name:var(--font-display)] text-lg font-medium leading-none tracking-wide text-white lg:text-xl"
      >
        {service.title}
      </h3>

      {/*
        ⚠️  THIS BLOCK IS IN FLOW (`relative`), NOT ABSOLUTE. It is load-bearing
        for LAYOUT, not just for reading.

        The plate above is `absolute inset-0` and the title is absolute too. If
        this were absolute as well, the wrapper would contain nothing in normal
        flow — and a flex item whose width is `auto` sizes from its content, so
        the wrapper computed a width of ZERO. Every card collapsed to a point
        and the text piled up in the middle of the screen with no images at all.
        That is what happened the first time the text was lifted out of the
        rotating plate.

        Keeping it in flow means the card's intrinsic width comes from this
        text plus its padding, exactly as it did when the text lived inside the
        plate — while still sitting outside the transform, so `rotateY` never
        shears it.

        `pointer-events-none` so clicks fall through to the link beneath, and
        `aria-hidden` because the link already carries all of this in its
        accessible name.
      */}
      <div
        aria-hidden
        className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-4 pr-11 text-white"
      >
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
    </div>
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
      /*
        `perspective` and `preserve-3d` live HERE, on the row, so every card
        shares one vanishing point — see the note at the top of this file.
        Scoped to md+: below that the row is a horizontal scroller, and
        `overflow-x-auto` forces a flattened stacking context that kills the 3D
        anyway, so paying for it on a phone buys nothing.
      */
      className="flex snap-x snap-mandatory flex-nowrap items-end gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-full md:justify-center md:overflow-visible md:px-0 md:pb-0 md:[perspective:1600px] md:[transform-style:preserve-3d] lg:gap-6"
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
