'use client';

import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Skeleton, EmptyState } from '@/components/ui/states';
import type { DaySlots } from '@/lib/booking/availability';

/**
 * Calendar + slot column, built to the booking design.
 *
 * Structure: a month grid on a Surface Low panel, and the chosen day's times
 * listed beside it as full-width rows. Selected time takes a Muted Gold border
 * with a Linen fill and a check — exactly the treatment in the design file.
 *
 * ACCESSIBILITY. The calendar is a real `grid` with `gridcell` semantics and
 * the time list is a `radiogroup`. Both matter more here than anywhere else in
 * the product: this is the one screen a keyboard or screen-reader user cannot
 * route around, because there is no other way to pick a time.
 *
 * Dates with no availability are rendered `disabled` rather than hidden, so the
 * month keeps its shape and a visitor can see that (say) Sundays are simply not
 * worked rather than wondering whether the calendar is broken.
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Local-date key (YYYY-MM-DD) — never toISOString(), which shifts to UTC. */
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function SlotPicker({
  days,
  loading,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  disabled,
}: {
  days: DaySlots[];
  loading: boolean;
  selectedDate: string | null;
  selectedSlot: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (startIso: string) => void;
  weekOffset?: number;
  onWeekChange?: (offset: number) => void;
  disabled?: boolean;
}) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d.slots])), [days]);
  const firstAvailable = days.find((d) => d.slots.length > 0)?.date ?? null;
  const active = selectedDate ?? firstAvailable;

  const [cursor, setCursor] = useState(() => {
    const base = active ? new Date(`${active}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Follow the selection into its month if it lands outside the shown one.
  useEffect(() => {
    if (!active) return;
    const d = new Date(`${active}T00:00:00`);
    const syncCursor = window.setTimeout(() => {
      setCursor((c) =>
        c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
          ? c
          : new Date(d.getFullYear(), d.getMonth(), 1),
      );
    }, 0);
    return () => window.clearTimeout(syncCursor);
  }, [active]);

  const grid = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = start.getDay();
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    }
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const slots = active ? byDate.get(active) ?? [] : [];

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2" role="status" aria-label="Loading available times">
        <Skeleton className="h-[420px] w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <span className="sr-only">Loading available times…</span>
      </div>
    );
  }

  if (days.every((d) => d.slots.length === 0)) {
    return (
      <EmptyState
        title="No times available in this period"
        description="Try looking further ahead, or call and we will find a time that works."
        action={{ label: 'Contact us', href: '/contact' }}
      />
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* ------------------------------ Calendar ------------------------------ */}
      <div className="bg-[var(--color-card-cream)] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="flex size-9 items-center justify-center text-[var(--color-cocoa)] transition-colors hover:bg-[var(--color-cream)]"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="flex size-9 items-center justify-center text-[var(--color-cocoa)] transition-colors hover:bg-[var(--color-cream)]"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div role="grid" aria-label={`Dates in ${monthLabel}`} className="mt-8">
          <div role="row" className="grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                role="columnheader"
                className="label-small pb-4 text-center uppercase text-[var(--color-body-warm)]"
              >
                {w}
              </div>
            ))}
          </div>

          <div role="rowgroup" className="grid grid-cols-7 gap-y-1">
            {grid.map((date, i) => {
              if (!date) return <div key={`pad-${i}`} role="gridcell" aria-hidden />;

              const key = dateKey(date);
              const has = (byDate.get(key)?.length ?? 0) > 0;
              const isActive = active === key;

              return (
                <div key={key} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    disabled={!has || disabled}
                    aria-pressed={isActive}
                    aria-label={
                      has
                        ? `${date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} — ${byDate.get(key)!.length} times available`
                        : `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} — unavailable`
                    }
                    onClick={() => onSelectDate(key)}
                    className={cn(
                      'tabular flex size-10 items-center justify-center text-base transition-colors',
                      isActive
                        ? 'bg-[var(--color-cocoa)] text-[var(--color-card-cream)]'
                        : has
                          ? 'text-[var(--color-body-warm)] hover:bg-[var(--color-cream)]'
                          : 'cursor-not-allowed text-[var(--color-outline-variant)]',
                    )}
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------- Times -------------------------------- */}
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">
          {active
            ? new Date(`${active}T00:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })
            : 'Select a date'}
        </h3>

        <div
          role="radiogroup"
          aria-label="Available times"
          className="mt-6 max-h-[420px] space-y-3 overflow-y-auto pr-1"
        >
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.start;
            return (
              <button
                key={slot.start}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectSlot(slot.start)}
                className={cn(
                  'flex w-full items-center justify-between border px-6 py-5 text-left text-base transition-colors disabled:opacity-50',
                  isSelected
                    ? 'border-[var(--color-saffron)] bg-[var(--color-cream)] text-[var(--color-cocoa)]'
                    : 'border-[var(--color-outline-variant)] text-[var(--color-body-warm)] hover:border-[var(--color-cocoa)]',
                )}
              >
                <span className="tabular">{formatTime(slot.start)}</span>
                {isSelected && <CheckCircle2 className="size-5" aria-hidden />}
              </button>
            );
          })}

          {slots.length === 0 && (
            <p className="border border-dashed border-[var(--color-outline-variant)] px-6 py-8 text-center text-sm text-[var(--color-body-warm)]">
              No times remaining on this date. Choose another from the calendar.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--color-body-warm)]">
          All times shown in India Standard Time (IST).
        </p>
      </div>
    </div>
  );
}
