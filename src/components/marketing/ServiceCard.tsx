import Link from 'next/link';
import { ArrowRight, Clock, Video, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { formatPaise } from '@/lib/money';
import { Button } from '@/components/ui/button';
import type { Service } from '@/types/database';

const MODE_ICON = { video: Video, phone: PhoneIcon, in_person: MapPin } as const;
const MODE_LABEL = { video: 'Video call', phone: 'Phone call', in_person: 'In person' } as const;

/**
 * Service card.
 *
 * Shows price AND duration on the card itself. Both decisions are evidence-led:
 * duration removes the most common pre-purchase question, and hiding price
 * forces a "request a quote" step that adds a day of latency and loses buyers
 * who are ready now (docs/research.md §3.3).
 */
export function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
  const ModeIcon = MODE_ICON[service.mode];

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[var(--radius-card)] border bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-saffron)]/40 hover:shadow-[var(--shadow-overlay)] ${
        featured ? 'border-[var(--color-saffron)]/35' : 'border-[var(--color-linen)]'
      }`}
    >
      {featured && (
        <span className="absolute -top-2.5 left-6 rounded-full bg-[var(--color-saffron)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Most booked
        </span>
      )}

      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {service.title}
        </Link>
      </h3>

      {service.tagline && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark)]">{service.tagline}</p>
      )}

      <dl className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-stone)]">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Duration</dt>
          <Clock className="size-3.5" aria-hidden />
          <dd>{service.duration_minutes} minutes</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Format</dt>
          <ModeIcon className="size-3.5" aria-hidden />
          <dd>{MODE_LABEL[service.mode]}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-stone)]">From</p>
          <p className="tabular font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
            {formatPaise(service.price_paise)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          tabIndex={-1}
          className="relative z-10 pointer-events-none group-hover:border-[var(--color-saffron)] group-hover:text-[var(--color-ember)]"
        >
          {service.bookable_online ? 'Book' : 'Enquire'}
          <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
