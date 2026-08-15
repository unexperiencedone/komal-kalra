import { cn } from '@/lib/utils';

/**
 * Table primitives for the admin console.
 *
 * Real <table> markup with <th scope>, not a div grid. Admin tables are exactly
 * where screen-reader users need column association, and a div grid silently
 * discards it.
 *
 * The mobile strategy is horizontal scroll inside a bounded container rather
 * than a card-per-row transform. For financial data, keeping the columns
 * aligned matters more than avoiding a scrollbar: a payments table reflowed
 * into stacked cards becomes impossible to scan for anomalies.
 */
export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden  border border-[var(--color-outline-variant)] bg-white', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <table className="w-full min-w-[720px] text-sm">
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  );
}

export function Th({ children, className, align = 'left' }: {
  children: React.ReactNode; className?: string; align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-[var(--color-outline-variant)] bg-[var(--color-warm-ivory)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align = 'left' }: {
  children: React.ReactNode; className?: string; align?: 'left' | 'right';
}) {
  return (
    <td className={cn('px-4 py-3.5 align-middle', align === 'right' ? 'text-right' : 'text-left', className)}>
      {children}
    </td>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--color-outline-variant)]">{children}</tbody>;
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <form className="mb-5 flex flex-wrap items-end gap-3" role="search">
      {children}
    </form>
  );
}
