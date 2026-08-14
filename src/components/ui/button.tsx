import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button.
 *
 * Note the sizing: label text is 15px/600 minimum on filled variants. White on
 * Saffron measures 4.0:1, which passes WCAG AA for large text and UI components
 * but not for small body text — so the type size is part of the accessibility
 * contract, not a stylistic choice (docs/research.md §2.3).
 *
 * Radius is `--radius-control`, never a full pill: pills read consumer-app, and
 * this is a professional practice.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold transition-[background-color,color,border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-saffron)] text-white hover:bg-[var(--color-ember)] active:bg-[var(--color-ember)]',
        secondary: 'bg-[var(--color-ink)] text-[var(--color-sand)] hover:bg-[var(--color-bark)]',
        outline: 'border border-[var(--color-linen)] bg-white text-[var(--color-ink)] hover:border-[var(--color-saffron)] hover:text-[var(--color-ember)]',
        ghost: 'text-[var(--color-bark)] hover:bg-[var(--color-linen)] hover:text-[var(--color-ink)]',
        link: 'text-[var(--color-ember)] underline-offset-4 hover:underline',
        destructive: 'bg-[var(--color-clay)] text-white hover:brightness-95',
        quiet: 'bg-[var(--color-linen)] text-[var(--color-ink)] hover:bg-[var(--color-linen-hover)]',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm [&_svg]:size-4',
        md: 'h-11 px-5 text-[15px] [&_svg]:size-4',
        lg: 'h-[52px] px-7 text-base [&_svg]:size-5',
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
  /** Announced to screen readers while `loading`. */
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

export { buttonVariants };
