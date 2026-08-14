'use client';

import { useActionState, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { saveService, type AdminActionState } from '@/app/admin/actions';
import { formatPaise, paiseToRupees } from '@/lib/money';
import { Field, Input, Textarea, Select, Checkbox } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineAlert } from '@/components/ui/states';
import type { Service } from '@/types/database';

/**
 * Service management.
 *
 * Price is entered in RUPEES here and converted to paise server-side
 * (admin/actions.ts). That is the one deliberate exception to "paise
 * everywhere": asking a person to type 210000 for a ₹2,100 service is an
 * invitation to a very expensive typo.
 */
export function ServiceEditor({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveService, null);

  if (editing) {
    const s = editing === 'new' ? null : editing;
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            {s ? `Edit “${s.title}”` : 'New service'}
          </h2>
          <Button variant="ghost" onClick={() => setEditing(null)}>Back to list</Button>
        </div>

        <form action={action} className="space-y-6">
          {s && <input type="hidden" name="id" value={s.id} />}
          {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}
          {state?.success && <InlineAlert tone="success">{state.success}</InlineAlert>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" htmlFor="s-title" required>
              <Input name="title" defaultValue={s?.title ?? ''} required />
            </Field>
            <Field label="URL slug" htmlFor="s-slug" required hint="Appears in the address: /services/your-slug">
              <Input name="slug" defaultValue={s?.slug ?? ''} required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            </Field>
          </div>

          <Field label="Tagline" htmlFor="s-tagline" hint="One line, shown on the service card.">
            <Input name="tagline" defaultValue={s?.tagline ?? ''} maxLength={160} />
          </Field>

          <Field label="Description" htmlFor="s-desc" required hint="Shown on the service page. Write it as you would explain it to someone on the phone.">
            <Textarea name="description" defaultValue={s?.description ?? ''} rows={6} required />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Price (₹)" htmlFor="s-price" required hint="In rupees, not paise.">
              <Input name="priceRupees" type="number" min={0} step={1} required
                defaultValue={s ? paiseToRupees(s.price_paise) : ''} />
            </Field>
            <Field label="Duration (minutes)" htmlFor="s-duration" required>
              <Input name="durationMinutes" type="number" min={5} max={480} required defaultValue={s?.duration_minutes ?? 45} />
            </Field>
            <Field label="Buffer after (minutes)" htmlFor="s-buffer" required hint="Gap before the next booking.">
              <Input name="bufferMinutes" type="number" min={0} max={120} required defaultValue={s?.buffer_minutes ?? 10} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Format" htmlFor="s-mode" required>
              <Select name="mode" defaultValue={s?.mode ?? 'video'}>
                <option value="video">Video call</option>
                <option value="phone">Phone call</option>
                <option value="in_person">In person</option>
              </Select>
            </Field>
            <Field label="Minimum notice (hours)" htmlFor="s-notice" required hint="Stops last-minute bookings.">
              <Input name="minNoticeHours" type="number" min={0} max={720} required defaultValue={s?.min_notice_hours ?? 12} />
            </Field>
            <Field label="Bookable up to (days)" htmlFor="s-advance" required>
              <Input name="maxAdvanceDays" type="number" min={1} max={365} required defaultValue={s?.max_advance_days ?? 60} />
            </Field>
          </div>

          <Field label="Display order" htmlFor="s-sort" required hint="Lower numbers appear first.">
            <Input name="sortOrder" type="number" min={0} max={999} required defaultValue={s?.sort_order ?? 0} />
          </Field>

          <fieldset className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-5">
            <legend className="px-1.5 text-sm font-semibold">Visibility</legend>
            <Checkbox id="s-active" name="active" defaultChecked={s?.active ?? true}
              label="Active — visible on the website" />
            <Checkbox id="s-bookable" name="bookableOnline" defaultChecked={s?.bookable_online ?? true}
              label="Bookable online — turn off to make it enquiry-only" />
            <Checkbox id="s-featured" name="featured" defaultChecked={s?.featured ?? false}
              label="Featured — highlighted with a “Most booked” label" />
          </fieldset>

          <div className="flex gap-3">
            <Button type="submit" size="lg" loading={pending} loadingText="Saving…">
              {s ? 'Save changes' : 'Create service'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => setEditing('new')}>
        <Plus aria-hidden /> New service
      </Button>

      {state?.success && <div className="mt-4"><InlineAlert tone="success">{state.success}</InlineAlert></div>}

      <ul className="mt-6 space-y-3">
        {services.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="font-sans text-[15px] font-semibold">{s.title}</p>
                {!s.active && <Badge tone="danger">Hidden</Badge>}
                {s.featured && <Badge tone="accent">Featured</Badge>}
                {!s.bookable_online && <Badge tone="warning">Enquiry only</Badge>}
              </div>
              <p className="mt-1 text-sm text-[var(--color-stone)]">
                {s.duration_minutes} min · <span className="tabular">{formatPaise(s.price_paise)}</span> · /services/{s.slug}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
              <Pencil aria-hidden /> Edit
            </Button>
          </li>
        ))}
      </ul>

      {services.length === 0 && (
        <p className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--color-linen)] p-10 text-center text-sm text-[var(--color-stone)]">
          No services yet. Create your first one to open bookings.
        </p>
      )}
    </div>
  );
}
