import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Cards — "Editorial Cards".
 *
 * No shadows. Defined by a change in background colour (a Linen Grey box on a
 * Warm Ivory page) plus a 1px Muted Gold hairline, with sharp edges. The spec
 * is explicit that depth here is tonal, not elevational.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative border border-[var(--color-hairline)] bg-[var(--color-card-cream)]',
        'before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 p-6 sm:p-8', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-terracotta)]', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-[var(--color-body-warm)]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0 sm:p-8 sm:pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-4 p-6 pt-0 sm:p-8 sm:pt-0', className)} {...props} />;
}

/** Eyebrow + heading + gold rule — the section opener used across the site. */
export function SectionHeading({
  eyebrow, title, description, onDark = false, className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && (
        <p className={cn('label-caps', onDark ? 'text-[var(--color-saffron-lift)]' : 'text-[var(--color-saffron-deep)]')}>
          {eyebrow}
        </p>
      )}
      <div className="inline-block text-left">
        <h2 className={cn('mt-4 text-[length:var(--text-h2)]', onDark && 'text-[var(--color-card-cream)]')}>
          {title}
        </h2>
        <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
      </div>
      {description && (
        <p
          className={cn(
            'mt-6 text-base leading-relaxed',
            onDark ? 'text-[var(--color-on-primary-container)]' : 'text-[var(--color-body-warm)]',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
