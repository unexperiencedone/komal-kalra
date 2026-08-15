import Image from 'next/image';
import { Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { BRAND, POLICY } from '@/lib/config';
import { img } from '@/lib/content/imagery';
import type { Service } from '@/types/database';

/**
 * Booking Summary panel from the design — Linen Grey block, sharp edges,
 * practitioner portrait, then Service / Duration / Date & Time, then the total
 * separated by a hairline.
 *
 * The total is shown here AND recomputed server-side at order time. This panel
 * is a display of what the server will charge, never the source of it.
 */
export function BookingSummary({
  service,
  startsAt,
  endsAt,
  totalPaise,
  taxPaise = 0,
}: {
  service: Service | null;
  startsAt?: string | null;
  endsAt?: string | null;
  totalPaise: number;
  taxPaise?: number;
}) {
  const portrait = img('practitionerPortrait');

  return (
    <aside className="border border-[color-mix(in_srgb,var(--color-muted-gold)_25%,transparent)] bg-[var(--color-surface-low)] p-8 lg:sticky lg:top-28">
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-cosmic-navy)]">
        Booking
        <br />
        Summary
      </h2>

      <div className="mt-8 flex items-center gap-4 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
        <Image
          src={portrait.src}
          alt={portrait.alt}
          width={112}
          height={112}
          sizes="56px"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-cosmic-navy)]">
            {BRAND.name}
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Vedic Astrologer</p>
        </div>
      </div>

      <dl className="mt-8 space-y-6 border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
        <div>
          <dt className="label-caps text-[var(--color-on-surface-variant)]">Service</dt>
          <dd className="mt-2 text-base text-[var(--color-on-surface)]">
            {service?.title ?? 'Not selected'}
          </dd>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="label-caps text-[var(--color-on-surface-variant)]">Duration</dt>
            <dd className="mt-2 flex items-center gap-2 text-base text-[var(--color-on-surface)]">
              <Clock className="size-4 text-[var(--color-muted-gold)]" aria-hidden />
              {service ? `${service.duration_minutes} mins` : '—'}
            </dd>
          </div>
          <div>
            <dt className="label-caps text-[var(--color-on-surface-variant)]">Date &amp; Time</dt>
            <dd className="mt-2 text-base text-[var(--color-on-surface)]">
              {startsAt ? (
                <>
                  {formatLongDay(startsAt)}
                  <span className="tabular block text-sm text-[var(--color-on-surface-variant)]">
                    {formatTime(startsAt)}
                    {endsAt ? ` – ${formatTime(endsAt)}` : ''} IST
                  </span>
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </div>

        {taxPaise > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[var(--color-on-surface-variant)]">GST</dt>
            <dd className="tabular text-sm text-[var(--color-on-surface)]">{formatPaise(taxPaise)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 flex items-baseline justify-between border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] pt-8">
        <span className="text-base text-[var(--color-on-surface)]">Total Amount</span>
        <span className="tabular font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--color-cosmic-navy)]">
          {formatPaise(totalPaise)}
        </span>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-on-surface-variant)]">
        {POLICY.cancellationSummary}
      </p>
    </aside>
  );
}
