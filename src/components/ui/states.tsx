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
  return <div className={cn('shimmer rounded-[var(--radius-control)]', className)} aria-hidden />;
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
    <div className="divide-y divide-[var(--color-linen)]" role="status" aria-label="Loading">
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
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-linen)] bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--color-linen)]">
        <Icon className="size-5 text-[var(--color-stone)]" />
      </div>
      <p className="font-sans text-[15px] font-semibold text-[var(--color-ink)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-stone)]">{description}</p>
      )}
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-5">
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
      className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-clay)]/25 bg-[var(--color-clay-tint)] px-6 py-12 text-center"
    >
      <AlertTriangle className="mb-3 size-6 text-[var(--color-clay)]" aria-hidden />
      <p className="font-sans text-[15px] font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-bark)]">{description}</p>
      <div className="mt-5 flex gap-3">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
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
    info: 'border-[var(--color-indigo)]/20 bg-[var(--color-indigo-tint)] text-[var(--color-indigo)]',
    success: 'border-[var(--color-sage)]/25 bg-[var(--color-sage-tint)] text-[var(--color-sage)]',
    warning: 'border-[var(--color-amber-warn)]/25 bg-[var(--color-amber-tint)] text-[var(--color-amber-warn)]',
    danger: 'border-[var(--color-clay)]/25 bg-[var(--color-clay-tint)] text-[var(--color-clay)]',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-[var(--radius-control)] border px-4 py-3 text-sm leading-relaxed', tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && 'mt-0.5', 'text-[var(--color-bark)]')}>{children}</div>
    </div>
  );
}
