import Link from 'next/link';
import { BRAND } from '@/lib/config';
import type { Service } from '@/types/database';

export function SiteFooter({ services = [] }: { services?: Service[] }) {
  const year = new Date().getFullYear();

  const linkClass =
    'text-[color-mix(in_srgb,var(--color-cream)_82%,transparent)] transition-colors duration-300 hover:text-white';

  return (
    <footer className="bg-gradient-to-b from-[var(--color-footer-top)] to-[var(--color-footer-btm)] py-12 md:py-16 no-print border-t border-[color-mix(in_srgb,var(--color-cream)_25%,transparent)] text-[var(--color-cream)]">
      <div className="shell flex flex-col items-center text-center gap-12">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.15em] text-[var(--color-cream)]">
            Komal Kalra
          </p>
          <p className="mt-4 max-w-md mx-auto text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-cream)_82%,transparent)]">
            Precision astrology and executive life coaching.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12 w-full text-left">
          <nav aria-label="Services" className="flex flex-col gap-4">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Services</h4>
            {services.length > 0
              ? services.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/services/${s.slug}`} className={linkClass}>
                    {s.title}
                  </Link>
                ))
              : <Link href="/services" className={linkClass}>All services</Link>}
            <Link href="/faq" className={linkClass}>Frequently asked</Link>
          </nav>

          <nav aria-label="Free tools" className="flex flex-col gap-4">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Free Tools</h4>
            <Link href="/free-tools" className={linkClass}>Calculators</Link>
            <Link href="/free-tools/free-kundli" className={linkClass}>Free Kundli</Link>
            <Link href="/free-tools/kundli-matching" className={linkClass}>Kundli Matching</Link>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-4">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Legal</h4>
            <Link href="/legal/privacy" className={linkClass}>Privacy</Link>
            <Link href="/legal/terms" className={linkClass}>Terms</Link>
            <Link href="/legal/refunds" className={linkClass}>Refunds</Link>
          </nav>

          <nav aria-label="Contact" className="flex flex-col gap-4">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Contact</h4>
            <Link href="/contact" className={linkClass}>Contact Form</Link>
            {BRAND.phones.map((phone, i) => (
              <a key={phone} href={`tel:${BRAND.phonesE164[i]}`} className={linkClass}>
                {phone}
              </a>
            ))}
            <a href={`mailto:${BRAND.email}`} className={linkClass}>{BRAND.email}</a>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Instagram
            </a>
          </nav>
        </div>

        <div className="w-full border-t border-[color-mix(in_srgb,var(--color-cream)_25%,transparent)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[color-mix(in_srgb,var(--color-cream)_78%,transparent)]">
          <p>
            © {year} {BRAND.fullName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { href: '/legal/terms', label: 'Terms' },
              { href: '/legal/privacy', label: 'Privacy' },
              { href: '/legal/refunds', label: 'Refunds' },
              { href: '/legal/delivery', label: 'Service delivery' },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
