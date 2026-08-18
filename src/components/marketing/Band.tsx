import { cn } from '@/lib/utils';

/**
 * A full-bleed page section with an explicit background tone.
 *
 * WHY THIS EXISTS
 *
 * Sections used to declare their own background inline — some with
 * `bg-[var(--color-cream)]`, some with `.band-low`, some with `.band-cream`.
 * Three different-looking declarations, one identical colour. The homepage
 * ended up with five consecutive cream sections and no visible boundary
 * between any of them, and the closing CTA ran straight into the footer
 * because both were terracotta.
 *
 * The fix is not more classes, it is fewer: five tones, one prop, typed. A
 * tone that does not exist is a build error instead of a section that quietly
 * inherits the body background.
 *
 * RHYTHM IS THE CALLER'S JOB
 *
 * This component cannot know what came before it, so it cannot alternate for
 * you. The page composes the rhythm; `npm run audit:bands` checks it; and
 * globals.css draws a hairline if two same-tone bands touch anyway. Three
 * layers, because the first two are advisory and this keeps regressing.
 */

export type BandTone = 'cream' | 'sand' | 'terracotta' | 'amber' | 'maroon';

const TONE_CLASS: Record<BandTone, string> = {
  cream: 'band-cream',
  sand: 'band-sand',
  terracotta: 'band-terracotta',
  amber: 'band-amber',
  maroon: 'band-maroon',
};

/** Light tones take the gold hairline; dark tones need a light one. */
const DARK_TONES: BandTone[] = ['terracotta', 'amber', 'maroon'];

export function Band({
  tone,
  children,
  className,
  size = 'lg',
  /** Hairline along the top edge. Use where two light bands must touch. */
  ruled = false,
  ...rest
}: {
  tone: BandTone;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'none';
  ruled?: boolean;
} & Omit<React.ComponentPropsWithoutRef<'section'>, 'children' | 'className'>) {
  const padding = {
    none: '',
    sm: 'py-10 md:py-14',
    md: 'py-[var(--spacing-section-md)]',
    lg: 'py-[var(--spacing-section-lg)]',
  }[size];

  return (
    <section
      data-band={tone}
      className={cn(
        TONE_CLASS[tone],
        padding,
        ruled &&
          (DARK_TONES.includes(tone)
            ? 'border-t border-[color-mix(in_srgb,#ffffff_22%,transparent)]'
            : 'border-t border-[color-mix(in_srgb,var(--color-hairline)_55%,transparent)]'),
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
