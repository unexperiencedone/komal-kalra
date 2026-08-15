import Link from 'next/link';
import { BRAND } from '@/lib/config';
import type { Service } from '@/types/database';

/**
 * Footer — Ink Black ground with a Muted Gold hairline along the top, per the
 * spec ("1px Muted Gold hairlines used to separate sections or define the top
 * of the footer").
 *
 * Link labels use Label Caps at 80% opacity rising to full on hover, which is
 * how the design file handles the muted/active distinction on dark grounds.
 */
export function SiteFooter({ services = [] }: { services?: Service[] }) {
  const year = new Date().getFullYear();

  const linkClass =
    'label-caps text-[var(--color-warm-ivory)] opacity-70 transition-opacity duration-300 hover:opacity-100';

  return (
    <footer className="band-ink no-print border-t border-[color-mix(in_srgb,var(--color-muted-gold)_25%,transparent)]">
      <div className="shell grid grid-cols-1 gap-12 py-16 md:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-warm-ivory)]">
            {BRAND.name}
          </p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-[var(--color-on-primary-container)]">
            Precision astrology and executive life coaching.
          </p>
          <p className="mt-8 text-xs text-[var(--color-on-primary-container)]">
            © {year} {BRAND.fullName}. All rights reserved.
          </p>
        </div>

        <nav aria-label="Services" className="flex flex-col gap-4">
          {services.length > 0
            ? services.slice(0, 5).map((s) => (
                <Link key={s.id} href={`/services/${s.slug}`} className={linkClass}>
                  {s.title}
                </Link>
              ))
            : <Link href="/services" className={linkClass}>All services</Link>}
          <Link href="/faq" className={linkClass}>Frequently asked</Link>
          <Link href="/contact" className={linkClass}>Contact</Link>
        </nav>

        <div className="flex flex-col gap-4 md:items-end">
          {BRAND.phones.map((phone, i) => (
            <a key={phone} href={`tel:${BRAND.phonesE164[i]}`} className={linkClass}>
              {phone}
            </a>
          ))}
          <a href={`mailto:${BRAND.email}`} className={linkClass}>{BRAND.email}</a>
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} mt-2`}
          >
            Instagram
          </a>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--color-warm-ivory)_12%,transparent)]">
        <div className="shell flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: '/legal/terms', label: 'Terms' },
              { href: '/legal/privacy', label: 'Privacy' },
              { href: '/legal/refunds', label: 'Cancellation & refunds' },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="label-small text-[var(--color-on-primary-container)] transition-colors hover:text-[var(--color-warm-ivory)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="max-w-xl text-[11px] leading-relaxed text-[var(--color-on-primary-container)]">
            Consultations are for guidance and personal reflection, and are not a substitute
            for medical, psychological, legal or financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
