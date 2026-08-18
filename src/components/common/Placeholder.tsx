import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Wraps fabricated content in a dashed outline with a warning ribbon.
 *
 * NOTE: Visible in production too; that is the point.
 * MUST NOT wrap content that feeds JSON-LD (e.g. fabricated reviews),
 * as that violates Google's structured data guidelines.
 */
export function Placeholder({
  children,
  className,
  label = 'PLACEHOLDER — REPLACE BEFORE LAUNCH',
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('relative border-2 border-dashed border-[#ef4444] p-4 m-2', className)}>
      <div className="absolute -top-3 -right-3 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-sm z-50">
        {label}
      </div>
      {children}
    </div>
  );
}
