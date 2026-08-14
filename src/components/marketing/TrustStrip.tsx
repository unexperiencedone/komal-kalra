import { ShieldCheck, Lock, CalendarCheck, Star } from 'lucide-react';

/**
 * Trust strip.
 *
 * IMPORTANT: every claim here is structurally verifiable — it describes how the
 * system actually works, not how popular it is. There are no visitor counts, no
 * "10,000+ happy clients", no years-of-experience figure.
 *
 * The brief forbids invented statistics, and this component enforces that by
 * simply not having a slot for one. When Komal supplies real verified numbers,
 * they belong in a separate component fed from the database — not here.
 *
 * The `reviewCount` prop is the one number shown, and it renders only when
 * genuine approved testimonials exist.
 */
export function TrustStrip({
  reviewCount = 0,
  averageRating = 0,
}: {
  reviewCount?: number;
  averageRating?: number;
}) {
  const items = [
    { icon: Lock, label: 'Secure payment', detail: 'Razorpay · PCI-DSS compliant' },
    { icon: ShieldCheck, label: 'Confidential', detail: 'Your details stay private' },
    { icon: CalendarCheck, label: 'Free cancellation', detail: 'Up to 24 hours before' },
  ];

  return (
    <section aria-label="Why you can book with confidence" className="border-y border-[var(--color-linen)] bg-white">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <ul className="grid divide-y divide-[var(--color-linen)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {items.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-center gap-3 px-0 py-5 lg:px-6">
              <Icon className="size-4 shrink-0 text-[var(--color-saffron)]" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
                <p className="truncate text-xs text-[var(--color-stone)]">{detail}</p>
              </div>
            </li>
          ))}

          {/* Renders only when there is genuine data behind it. */}
          {reviewCount > 0 && (
            <li className="flex items-center gap-3 px-0 py-5 lg:px-6">
              <Star className="size-4 shrink-0 fill-[var(--color-saffron)] text-[var(--color-saffron)]" aria-hidden />
              <div className="min-w-0">
                <p className="tabular text-sm font-semibold text-[var(--color-ink)]">
                  {averageRating.toFixed(1)} out of 5
                </p>
                <p className="truncate text-xs text-[var(--color-stone)]">
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
