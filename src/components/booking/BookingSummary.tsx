import Image from 'next/image';
import { Clock } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { BRAND, POLICY } from '@/lib/config';
import { img } from '@/lib/content/imagery';
import type { Service } from '@/types/database';
import { SHOW_PRICES } from '@/lib/config';

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
  const portrait = img('komalKalra');

  return (
    <aside className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 lg:sticky lg:top-28">
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-cocoa)]">
        Booking
        <br />
        Summary
      </h2>

      <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-hairline)] pt-8">
        <Image
          src={portrait.src}
          alt={portrait.alt}
          width={112}
          height={112}
          sizes="56px"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-cocoa)]">
            {BRAND.name}
          </p>
          <p className="text-sm text-[var(--color-body-warm)]">Vedic Astrologer</p>
        </div>
      </div>

      <dl className="mt-8 space-y-6 border-t border-[var(--color-hairline)] pt-8">
        <div>
          <dt className="label-caps text-[var(--color-body-warm)]">Service</dt>
          <dd className="mt-2 text-base text-[var(--color-body-warm)]">
            {service?.title ?? 'Not selected'}
          </dd>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="label-caps text-[var(--color-body-warm)]">Duration</dt>
            <dd className="mt-2 flex items-center gap-2 text-base text-[var(--color-body-warm)]">
              <Clock className="size-4 text-[var(--color-saffron)]" aria-hidden />
              {service ? `${service.duration_minutes} mins` : '—'}
            </dd>
          </div>
          <div>
            <dt className="label-caps text-[var(--color-body-warm)]">Date &amp; Time</dt>
            <dd className="mt-2 text-base text-[var(--color-body-warm)]">
              {startsAt ? (
                <>
                  {formatLongDay(startsAt)}
                  <span className="tabular block text-sm text-[var(--color-body-warm)]">
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

        {SHOW_PRICES && taxPaise > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[var(--color-body-warm)]">GST</dt>
            <dd className="tabular text-sm text-[var(--color-body-warm)]">{formatPaise(taxPaise)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-[var(--color-hairline)] pt-8">
        {SHOW_PRICES ? (
          <>
            <span className="text-base text-[var(--color-body-warm)]">Total Amount</span>
            <span className="tabular font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--color-cocoa)]">
              {formatPaise(totalPaise)}
            </span>
          </>
        ) : (
          /*
            A sentence, not a blank or a dash. This panel's job is to answer
            "what am I committing to", and with fees arranged in conversation
            the honest answer is that the amount is not settled here — which is
            information, where an empty total is just an apparent bug.
          */
          <span className="text-sm leading-relaxed text-[var(--color-body-warm)]">
            Astrologer Komal Kalra confirms the fee when she replies to your message.
          </span>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-body-warm)]">
        {POLICY.cancellationSummary}
      </p>
    </aside>
  );
}
