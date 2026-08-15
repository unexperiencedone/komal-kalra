import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button — "Silent Luxury".
 *
 * Three things define it, all taken from the design spec:
 *
 *   SHARP.  0px radius, everywhere. Not a stylistic preference — the spec
 *           calls it "precision, high-end tailoring, professional discipline",
 *           and a single rounded button breaks the whole language.
 *   CAPS.   Labels are uppercase Public Sans at 12px/600 with 0.12em tracking
 *           ("Label Caps"). That tracking is why the horizontal padding is
 *           generous: tight padding on wide-tracked caps looks cramped.
 *   FLAT.   No shadows. Hover shifts fill or border colour instead.
 *
 * Gold is deliberately absent as a fill. It is an accent in this system, and
 * white on Muted Gold measures 3.3:1 — nowhere near enough for a label.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-[0.12em] font-semibold transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Cosmic Navy fill, Warm Ivory text — 16.5:1. */
        primary: 'bg-[var(--color-cosmic-navy)] text-[var(--color-warm-ivory)] hover:bg-[var(--color-ink-black)]',
        /** Transparent with a 1px Cosmic Navy border. */
        secondary:
          'border border-[var(--color-cosmic-navy)] bg-transparent text-[var(--color-cosmic-navy)] hover:bg-[var(--color-cosmic-navy)] hover:text-[var(--color-warm-ivory)]',
        /** Transparent with a 1px Muted Gold border — the quieter outline. */
        gold: 'border border-[var(--color-muted-gold)] bg-transparent text-[var(--color-gold-deep)] hover:bg-[var(--color-muted-gold)] hover:text-white',
        /** For use on navy/ink grounds only. */
        onDark:
          'border border-[color-mix(in_srgb,var(--color-warm-ivory)_35%,transparent)] bg-transparent text-[var(--color-warm-ivory)] hover:bg-[var(--color-warm-ivory)] hover:text-[var(--color-cosmic-navy)]',
        ghost: 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-cosmic-navy)]',
        destructive: 'bg-[var(--color-error)] text-white hover:brightness-90',
      },
      size: {
        sm: 'h-9 px-4 text-[11px] [&_svg]:size-3.5',
        md: 'h-11 px-6 text-[12px] [&_svg]:size-4',
        lg: 'h-14 px-8 text-[12px] [&_svg]:size-4',
        icon: 'size-10 [&_svg]:size-4',
      },
      full: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', full: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, asChild = false, loading, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, full }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

/**
 * Text link styled as the spec's "Text Button" — underlined, no background.
 * Used for low-priority navigation such as "Back to services".
 */
export function TextLink({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--color-gold-deep)]',
        className,
      )}
      {...props}
    />
  );
}

export { buttonVariants };
