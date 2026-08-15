import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { InstagramIcon } from '@/components/common/icons';
import { BRAND } from '@/lib/config';
import type { Service } from '@/types/database';

export function SiteFooter({ services = [] }: { services?: Service[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print border-t border-[var(--color-linen)] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
              {BRAND.fullName}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-stone)]">
              Private one-to-one consultations in astrology, coaching, healing and counselling.
            </p>
            <div className="mt-5 flex gap-2.5">
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram — ${BRAND.instagramHandle}`}
                className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-linen)] text-[var(--color-bark)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember-text)]"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href={`tel:${BRAND.phonesE164[0]}`}
                aria-label={`Call ${BRAND.phones[0]}`}
                className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-linen)] text-[var(--color-bark)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember-text)]"
              >
                <Phone className="size-4" aria-hidden />
              </a>
            </div>
          </div>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-stone)]">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5">
              {services.length > 0
                ? services.map((s) => (
                    <li key={s.id}>
                      <Link href={`/services/${s.slug}`} className="text-sm text-[var(--color-bark)] transition-colors hover:text-[var(--color-ember-text)]">
                        {s.title}
                      </Link>
                    </li>
                  ))
                : (
                    <li>
                      <Link href="/services" className="text-sm text-[var(--color-bark)] hover:text-[var(--color-ember-text)]">
                        All services
                      </Link>
                    </li>
                  )}
            </ul>
          </nav>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-stone)]">
              Quick links
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: '/book', label: 'Book a consultation' },
                { href: '/about', label: 'About Komal' },
                { href: '/faq', label: 'Frequently asked questions' },
                { href: '/contact', label: 'Contact' },
                { href: '/login', label: 'Sign in' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[var(--color-bark)] transition-colors hover:text-[var(--color-ember-text)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-stone)]">
              Get in touch
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {BRAND.phones.map((p, i) => (
                <li key={p}>
                  <a href={`tel:${BRAND.phonesE164[i]}`} className="flex items-center gap-2 text-[var(--color-bark)] transition-colors hover:text-[var(--color-ember-text)]">
                    <Phone className="size-3.5 shrink-0" aria-hidden /> {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${BRAND.email}`} className="flex items-center gap-2 text-[var(--color-bark)] transition-colors hover:text-[var(--color-ember-text)]">
                  <Mail className="size-3.5 shrink-0" aria-hidden /> {BRAND.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--color-linen)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-stone)]">
            © {year} {BRAND.fullName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {[
              { href: '/legal/terms', label: 'Terms of service' },
              { href: '/legal/privacy', label: 'Privacy policy' },
              { href: '/legal/refunds', label: 'Cancellation & refunds' },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[var(--color-stone)] transition-colors hover:text-[var(--color-ember-text)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-[var(--color-stone)]">
          Consultations are intended for guidance and personal reflection. They are not a
          substitute for medical, psychological, legal or financial advice. If you are
          experiencing a health crisis, please contact a qualified professional.
        </p>
      </div>
    </footer>
  );
}
