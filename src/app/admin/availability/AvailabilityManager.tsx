'use client';

import { useActionState, useState } from 'react';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import {
  saveAvailabilityRule, deleteAvailabilityRule,
  saveAvailabilityException, deleteAvailabilityException,
  type AdminActionState,
} from '@/app/admin/actions';
import { formatLongDay } from '@/lib/date';
import { Field, Input, Select, Checkbox } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineAlert, EmptyState } from '@/components/ui/states';
import type { AvailabilityException, AvailabilityRule } from '@/types/database';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager({
  rules, exceptions,
}: {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
}) {
  const [addingRule, setAddingRule] = useState(false);
  const [addingException, setAddingException] = useState(false);
  const [ruleState, ruleAction, savingRule] = useActionState<AdminActionState, FormData>(saveAvailabilityRule, null);
  const [excState, excAction, savingExc] = useActionState<AdminActionState, FormData>(saveAvailabilityException, null);

  const byDay = DAYS.map((name, i) => ({ name, weekday: i, rules: rules.filter((r) => r.weekday === i) }));

  return (
    <div className="space-y-12">
      {/* -------------------- Weekly hours -------------------- */}
      <section aria-labelledby="hours-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="hours-heading" className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Weekly working hours
            </h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              Your normal pattern. It repeats every week until you change it.
            </p>
          </div>
          <Button size="sm" onClick={() => setAddingRule((v) => !v)}>
            <Plus aria-hidden /> Add hours
          </Button>
        </div>

        {ruleState?.error && <div className="mt-4"><InlineAlert tone="danger">{ruleState.error}</InlineAlert></div>}
        {ruleState?.success && <div className="mt-4"><InlineAlert tone="success">{ruleState.success}</InlineAlert></div>}

        {addingRule && (
          <form action={ruleAction} className="mt-4 grid gap-4  border border-[var(--color-outline-variant)] bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Day" htmlFor="r-day" required>
              <Select name="weekday" defaultValue="1">
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </Select>
            </Field>
            <Field label="From" htmlFor="r-start" required>
              <Input name="startTime" type="time" defaultValue="10:00" required />
            </Field>
            <Field label="To" htmlFor="r-end" required>
              <Input name="endTime" type="time" defaultValue="13:00" required />
            </Field>
            <Field label="Slots every" htmlFor="r-interval" required hint="How often a session can start.">
              <Select name="slotIntervalMinutes" defaultValue="30">
                {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </Select>
            </Field>
            <Field label="Label" htmlFor="r-label" hint="Just for you — e.g. Morning.">
              <Input name="label" maxLength={40} />
            </Field>
            <div className="flex items-end gap-3">
              <Checkbox id="r-active" name="active" defaultChecked label="Active" />
            </div>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={savingRule} loadingText="Saving…">Save hours</Button>
              <Button type="button" variant="ghost" onClick={() => setAddingRule(false)}>Cancel</Button>
            </div>
          </form>
        )}

        <ul className="mt-5 space-y-2">
          {byDay.map((day) => (
            <li key={day.name} className="flex flex-wrap items-center gap-4  border border-[var(--color-outline-variant)] bg-white px-5 py-3.5">
              <span className="w-24 shrink-0 text-sm font-medium">{day.name}</span>
              {day.rules.length === 0 ? (
                <span className="text-sm text-[var(--color-on-surface-variant)]">Not working</span>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {day.rules.map((r) => (
                    <span key={r.id} className="flex items-center gap-2  bg-[var(--color-warm-ivory)] py-1 pl-3 pr-1 text-sm">
                      <span className="tabular">{r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</span>
                      <span className="text-xs text-[var(--color-on-surface-variant)]">/{r.slot_interval_minutes}m</span>
                      {!r.active && <Badge tone="neutral">Off</Badge>}
                      <form action={deleteAvailabilityRule}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" aria-label={`Remove ${day.name} ${r.start_time.slice(0, 5)} hours`}
                          className="flex size-6 items-center justify-center rounded text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-error)]">
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </form>
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------- Exceptions -------------------- */}
      <section aria-labelledby="exceptions-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="exceptions-heading" className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Blocked dates & extra hours
            </h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              One-off changes: holidays, a day off, or extra hours outside your usual pattern.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAddingException((v) => !v)}>
            <Plus aria-hidden /> Add
          </Button>
        </div>

        {excState?.error && <div className="mt-4"><InlineAlert tone="danger">{excState.error}</InlineAlert></div>}
        {excState?.success && <div className="mt-4"><InlineAlert tone="success">{excState.success}</InlineAlert></div>}

        {addingException && (
          <form action={excAction} className="mt-4 grid gap-4  border border-[var(--color-outline-variant)] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date" htmlFor="e-date" required>
              <Input name="date" type="date" required />
            </Field>
            <Field label="From" htmlFor="e-start" hint="Leave both blank to block the whole day.">
              <Input name="startTime" type="time" />
            </Field>
            <Field label="To" htmlFor="e-end">
              <Input name="endTime" type="time" />
            </Field>
            <Field label="Reason" htmlFor="e-reason">
              <Input name="reason" maxLength={160} placeholder="Holiday, travel…" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Checkbox id="e-available" name="available"
                label="These are EXTRA hours I am available (leave unticked to block time)" />
            </div>
            <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={savingExc} loadingText="Saving…">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setAddingException(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {exceptions.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={CalendarOff} title="No upcoming exceptions" description="Block a date here when you are away, and it disappears from the booking calendar straight away." />
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {exceptions.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3  border border-[var(--color-outline-variant)] bg-white px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{formatLongDay(`${e.date}T00:00:00`)}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-on-surface-variant)]">
                    {e.start_time
                      ? `${e.start_time.slice(0, 5)} – ${e.end_time?.slice(0, 5)}`: 'Whole day'}
                    {e.reason && ` · ${e.reason}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={e.available ? 'success' : 'danger'}>
                    {e.available ? 'Extra hours' : 'Blocked'}
                  </Badge>
                  <form action={deleteAvailabilityException}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" aria-label={`Remove exception on ${e.date}`}
                      className="flex size-8 items-center justify-center rounded text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-error)]">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
