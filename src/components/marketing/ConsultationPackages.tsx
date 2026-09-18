import { CheckCircle2, Clock, Phone as PhoneIcon, Users, Video } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { cn } from '@/lib/utils';
import { formatPaise } from '@/lib/money';
import { CONSULTATION_PACKAGES } from '@/lib/content/packages';

/**
 * The published fee list, rendered as the same hairline-and-inset cards as the
 * rest of the editorial furniture on this site.
 *
 * Every figure comes from src/lib/content/packages.ts, which explains at
 * length why these prices are content rather than `services` rows and why they
 * print directly through formatPaise() instead of publicPrice(). The short
 * version: this is what a visitor is quoted, not what checkout would charge.
 *
 * Duration, format and inclusions are each rendered only where the fee sheet
 * actually states them — the family pack has no stated length, and printing a
 * plausible one would be inventing a commitment nobody made.
 *
 * `tone` is a prop rather than a fixed band because the section appears on two
 * pages whose surrounding band rhythm differs, and npm run audit:bands refuses
 * two neighbours of the same colour.
 */

const MODE = {
  phone: { Icon: PhoneIcon, label: 'By phone' },
  video: { Icon: Video, label: 'On screen' },
} as const;

const BAND = {
  cream: { band: 'band-cream', card: 'bg-[var(--color-card-cream)]' },
  sand: { band: 'band-sand', card: 'bg-[var(--color-cream)]' },
} as const;

/**
 * Five packages do not divide into two or three columns, so the last card
 * would otherwise sit beside an empty cell and read as a card that failed to
 * load. Widening it to close its row is the same move the service bento makes
 * with its lead tile, and it is computed rather than hardcoded so the layout
 * still resolves if a package is added or withdrawn.
 */
function fillsRow(index: number): string {
  const total = CONSULTATION_PACKAGES.length;
  const isLast = index === total - 1;
  if (!isLast) return '';

  return [
    total % 2 === 1 ? 'sm:col-span-2' : '',
    total % 3 === 2 ? 'lg:col-span-2' : '',
    // A lone card on the final row of three stays one column wide: stretched
    // across the full width it stops looking like its four siblings.
    total % 3 === 1 ? 'lg:col-span-1' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function ConsultationPackages({
  tone = 'cream',
  headingId = 'packages-heading',
}: {
  tone?: 'cream' | 'sand';
  /** Unique per page — two sections may not share a heading id. */
  headingId?: string;
}) {
  const skin = BAND[tone];

  return (
    <section aria-labelledby={headingId} className={cn(skin.band, 'py-[var(--spacing-section-lg)]')}>
      <div className="shell">
        <Reveal>
          <p className="label-caps text-[var(--color-saffron-deep)]">Consultation packages</p>
          <h2 id={headingId} className="mt-4 text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
            What a session costs
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-body-warm)]">
            Fixed fees, stated upfront. Choose the length of conversation you need — the
            fee covers the session itself, and nothing is added afterwards.
          </p>
        </Reveal>

        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CONSULTATION_PACKAGES.map((pkg, i) => {
            const mode = pkg.mode ? MODE[pkg.mode] : null;

            return (
              <Reveal as="li" key={pkg.id} delay={i * 80} className={fillsRow(i)}>
                <article
                  className={cn(
                    'relative flex h-full flex-col border border-[var(--color-hairline)] p-8 sm:p-10',
                    'before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)]',
                    skin.card,
                  )}
                >
                  <p className="label-caps text-[var(--color-saffron-deep)]">{pkg.astrologer}</p>

                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cocoa)]">
                    {pkg.name}
                  </h3>

                  <p className="mt-6 tabular font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--color-cocoa)]">
                    {formatPaise(pkg.pricePaise)}
                  </p>

                  {/* Duration and format are absent on at least one package, so
                      the row has to survive being empty — hence the wrapper is
                      only rendered when something will go inside it. */}
                  {(pkg.durationMinutes !== null || mode) && (
                    <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-body-warm)]">
                      {pkg.durationMinutes !== null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Duration</dt>
                          <Clock className="size-3.5 text-[var(--color-saffron)]" aria-hidden />
                          <dd className="label-small">{pkg.durationMinutes} MIN</dd>
                        </div>
                      )}
                      {mode && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Format</dt>
                          <mode.Icon className="size-3.5 text-[var(--color-saffron)]" aria-hidden />
                          <dd className="label-small">{mode.label}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-body-warm)]">
                    <Users className="size-3.5 shrink-0 text-[var(--color-saffron)]" aria-hidden />
                    {pkg.audience}
                  </p>

                  {pkg.inclusions.length > 0 && (
                    <ul className="mt-6 space-y-3 border-t border-[color-mix(in_srgb,var(--color-hairline)_60%,transparent)] pt-6">
                      {pkg.inclusions.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-body-warm)]">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-saffron)]" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={120}>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-[var(--color-body-warm)]">
            All fees are in Indian rupees and cover one session. Call or message to confirm
            a time and arrange payment.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
