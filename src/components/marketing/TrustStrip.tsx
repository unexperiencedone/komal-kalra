import { ShieldCheck, Lock, CalendarCheck, Star } from 'lucide-react';

/**
 * Trust strip.
 *
 * Every claim here is structurally verifiable — it describes how the system
 * actually works, not how popular it is. There are no visitor counts, no
 * "10,000+ happy clients", no years-of-experience figure.
 *
 * The brief forbids invented statistics, and this component enforces that by
 * simply having no slot for one. `reviewCount` is the single number shown, and
 * it renders only when genuine approved testimonials exist.
 */
export function TrustStrip({
  reviewCount = 0,
  averageRating = 0,
}: {
  reviewCount?: number;
  averageRating?: number;
}) {
  const items = [
    {
      icon: Lock, label: 'Secure payment', detail: 'Razorpay · PCI-DSS compliant',
      plate: 'bg-[var(--color-indigo-tint)]', tint: 'text-[var(--color-indigo)]',
    },
    {
      icon: ShieldCheck, label: 'Confidential', detail: 'Your details stay private',
      plate: 'bg-[var(--color-jade-tint)]', tint: 'text-[var(--color-jade)]',
    },
    {
      icon: CalendarCheck, label: 'Free cancellation', detail: 'Up to 24 hours before',
      plate: 'bg-[var(--color-teal-tint)]', tint: 'text-[var(--color-teal)]',
    },
  ];

  return (
    <section aria-label="Why you can book with confidence" className="band-warm border-y border-[var(--color-linen)]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <ul className="grid divide-y divide-[var(--color-edge-hover)]/50 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {items.map(({ icon: Icon, label, detail, plate, tint }) => (
            <li key={label} className="flex items-center gap-3 px-0 py-5 lg:px-6">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${plate}`}>
                <Icon className={`size-4 ${tint}`} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
                <p className="truncate text-xs text-[var(--color-bark)]">{detail}</p>
              </div>
            </li>
          ))}

          {/* Renders only when there is genuine data behind it. */}
          {reviewCount > 0 && (
            <li className="flex items-center gap-3 px-0 py-5 lg:px-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
                <Star className="size-4 fill-[var(--color-saffron)] text-[var(--color-saffron)]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="tabular text-sm font-semibold text-[var(--color-ink)]">
                  {averageRating.toFixed(1)} out of 5
                </p>
                <p className="truncate text-xs text-[var(--color-bark)]">
                  From {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
