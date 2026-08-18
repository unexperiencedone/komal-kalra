import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Loading / empty / error states.
 *
 * The brief requires every major workflow to have all four states. Centralising
 * them here is what makes that practical rather than aspirational — a new admin
 * table gets correct states by importing three components.
 *
 * Skeletons deliberately MATCH THE FINAL LAYOUT rather than being a centred
 * spinner: layout-matched skeletons avoid cumulative layout shift and reduce
 * perceived wait (docs/research.md §2.6).
 */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer ', className)} aria-hidden />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[var(--color-cream)]" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox, title, description, action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center  border border-dashed border-[var(--color-cream)] bg-[var(--color-card-cream)] px-6 py-14 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--color-cream)]">
        <Icon className="size-5 text-[var(--color-body-warm)]" />
      </div>
      <p className="font-sans text-[15px] font-semibold text-[var(--color-cocoa)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-body-warm)]">{description}</p>
      )}
      {action && (
        <Button asChild variant="secondary" size="sm" className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

/**
 * Error state. Always says what happened AND what to do next — an error screen
 * with no action is a dead end, and on a booking flow a dead end is a lost sale.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'This did not load as expected. Trying again usually fixes it.',
  onRetry,
  action,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center  border border-[var(--color-error)]/25 bg-[var(--color-error-container)] px-6 py-12 text-center"
    >
      <AlertTriangle className="mb-3 size-6 text-[var(--color-error)]" aria-hidden />
      <p className="font-sans text-[15px] font-semibold text-[var(--color-cocoa)]">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-body-warm)]">{description}</p>
      <div className="mt-5 flex gap-3">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw aria-hidden /> Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export function InlineAlert({
  tone = 'info', title, children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-[var(--color-cocoa)]/20 bg-[var(--color-card-cream)] text-[var(--color-cocoa)]',
    success: 'border-[var(--color-success)]/25 bg-[var(--color-success-container)] text-[var(--color-success)]',
    warning: 'border-[var(--color-warning)]/25 bg-[var(--color-warning-container)] text-[var(--color-warning)]',
    danger: 'border-[var(--color-error)]/25 bg-[var(--color-error-container)] text-[var(--color-error)]',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(' border px-4 py-3 text-sm leading-relaxed', tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && 'mt-0.5', 'text-[var(--color-body-warm)]')}>{children}</div>
    </div>
  );
}
