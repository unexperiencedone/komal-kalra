'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Skeleton, EmptyState } from '@/components/ui/states';
import type { DaySlots } from '@/lib/booking/availability';

/**
 * Date strip + time grid.
 *
 * Accessibility: the times are a real radiogroup, not a grid of divs with
 * onClick. That gives arrow-key navigation, a single tab stop, and correct
 * announcement of "3 of 12 selected" — all of which a div grid silently loses.
 *
 * Times are rendered in the business timezone (Asia/Kolkata) regardless of the
 * visitor's device, because a booking confirmation that says a different time
 * from the calendar is the fastest possible way to create a no-show.
 */
export function SlotPicker({
  days,
  loading,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  weekOffset,
  onWeekChange,
  disabled,
}: {
  days: DaySlots[];
  loading: boolean;
  selectedDate: string | null;
  selectedSlot: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (startIso: string) => void;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  disabled?: boolean;
}) {
  const dayList = useMemo(() => days.filter((d) => d.slots.length > 0), [days]);
  const active = dayList.find((d) => d.date === selectedDate) ?? dayList[0] ?? null;

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading available times">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-[76px] shrink-0" />)}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
        </div>
        <span className="sr-only">Loading available times…</span>
      </div>
    );
  }

  if (dayList.length === 0) {
    return (
      <div className="space-y-4">
        <WeekNav weekOffset={weekOffset} onWeekChange={onWeekChange} />
        <EmptyState
          title="No times available in this period"
          description="Try looking further ahead, or call us and we will find a time that works."
          action={{ label: 'Contact us', href: '/contact' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WeekNav weekOffset={weekOffset} onWeekChange={onWeekChange} />

      {/* Date strip */}
      <div role="radiogroup" aria-label="Choose a date" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {dayList.map((day) => {
          const date = new Date(`${day.date}T00:00:00`);
          const isActive = active?.date === day.date;
          return (
            <button
              key={day.date}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onSelectDate(day.date)}
              className={cn(
                'flex w-[76px] shrink-0 flex-col items-center rounded-[var(--radius-control)] border px-2 py-2.5 transition-colors disabled:opacity-50',
                isActive
                  ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)]'
                  : 'border-[var(--color-linen)] bg-white hover:border-[var(--color-edge-hover)]',
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-stone)]">
                {date.toLocaleDateString('en-IN', { weekday: 'short' })}
              </span>
              <span className={cn('tabular mt-0.5 text-lg font-semibold', isActive ? 'text-[var(--color-ember)]' : 'text-[var(--color-ink)]')}>
                {date.getDate()}
              </span>
              <span className="text-[10px] text-[var(--color-stone)]">
                {day.slots.length} {day.slots.length === 1 ? 'slot' : 'slots'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Times */}
      {active && (
        <fieldset disabled={disabled}>
          <legend className="mb-3 text-sm font-medium text-[var(--color-ink)]">
            Available times on{' '}
            {new Date(`${active.date}T00:00:00`).toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </legend>

          <div role="radiogroup" aria-label="Choose a time" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {active.slots.map((slot) => {
              const isSelected = selectedSlot === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectSlot(slot.start)}
                  className={cn(
                    'tabular h-11 rounded-[var(--radius-control)] border text-sm font-medium transition-colors disabled:opacity-50',
                    isSelected
                      ? 'border-[var(--color-saffron)] bg-[var(--color-ember)] text-white'
                      : 'border-[var(--color-linen)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ember)] hover:text-[var(--color-ember-text)]',
                  )}
                >
                  {formatTime(slot.start)}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[var(--color-stone)]">All times shown in India Standard Time (IST).</p>
        </fieldset>
      )}
    </div>
  );
}

function WeekNav({ weekOffset, onWeekChange }: { weekOffset: number; onWeekChange: (o: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onWeekChange(Math.max(0, weekOffset - 1))}
        disabled={weekOffset === 0}
        className="inline-flex items-center gap-1 rounded-[var(--radius-control)] px-2 py-1.5 text-sm font-medium text-[var(--color-bark)] transition-colors hover:bg-[var(--color-linen)] disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="size-4" aria-hidden /> Earlier
      </button>
      <span className="text-sm text-[var(--color-stone)]">
        {weekOffset === 0 ? 'Next 2 weeks' : `${weekOffset * 14} days ahead`}
      </span>
      <button
        type="button"
        onClick={() => onWeekChange(weekOffset + 1)}
        className="inline-flex items-center gap-1 rounded-[var(--radius-control)] px-2 py-1.5 text-sm font-medium text-[var(--color-bark)] transition-colors hover:bg-[var(--color-linen)]"
      >
        Later <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
