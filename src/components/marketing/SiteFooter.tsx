import Link from 'next/link';
import { BRAND } from '@/lib/config';
import { InstagramIcon, YouTubeIcon } from '@/components/common/icons';
import { JOURNAL_POSTS } from '@/lib/content/journal';
import type { Service } from '@/types/database';

export function SiteFooter({ services = [] }: { services?: Service[] }) {
  const year = new Date().getFullYear();

  const linkClass =
    'text-[var(--color-cream)] transition-colors duration-300 hover:text-white';

  return (
    <footer className="no-print border-t border-[var(--color-cream)] bg-gradient-to-b from-[var(--color-footer-top)] to-[var(--color-footer-btm)] py-14 text-[var(--color-cream)] sm:py-16 lg:py-20">
      <div className="shell flex flex-col gap-12 sm:gap-14 lg:gap-16">
        <div className="w-full text-left">
          <p className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.15em] text-[var(--color-cream)]">
            Komal Kalra
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-cream)]">
            Precision astrology and executive life coaching.
          </p>
        </div>

        {/*
          FIVE COLUMNS AT lg, NOT FOUR.

          The Reading column was added with the blog and is not decoration: the
          articles are the only pages on this site a stranger has any reason to
          link to, and a footer link from every page is the cheapest internal
          link they will ever get. `shortTitle` rather than `title` because a
          column here is about 220px wide — see the note on that field in
          content/journal.ts.
        */}
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-12 text-left sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-10 lg:gap-y-0">
          <nav aria-label="Services" className="flex flex-col gap-3">
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

          <nav aria-label="Free tools" className="flex flex-col gap-3">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Free Tools</h4>
            <Link href="/free-tools" className={linkClass}>Calculators</Link>
            <Link href="/free-tools/free-kundli" className={linkClass}>Free Kundli</Link>
            <Link href="/free-tools/kundli-matching" className={linkClass}>Kundli Matching</Link>
          </nav>

          <nav aria-label="Reading" className="flex flex-col gap-3">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Reading</h4>
            {JOURNAL_POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={linkClass}>
                {post.shortTitle}
              </Link>
            ))}
            <Link href="/blog" className={linkClass}>All articles</Link>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-3">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Legal</h4>
            <Link href="/legal/privacy" className={linkClass}>Privacy</Link>
            <Link href="/legal/terms" className={linkClass}>Terms</Link>
          </nav>

          <nav aria-label="Contact" className="flex flex-col gap-3">
            <h4 className="label-caps text-[var(--color-saffron-lift)]">Contact</h4>
            <Link href="/contact" className={linkClass}>Contact Form</Link>
            {BRAND.phones.map((phone, i) => (
              <a key={phone} href={`tel:${BRAND.phonesE164[i]}`} className={linkClass}>
                {phone}
              </a>
            ))}
            <a href={`mailto:${BRAND.email}`} className={linkClass}>{BRAND.email}</a>
            <div className="mt-1 flex items-center gap-4">
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className={linkClass}>
                <InstagramIcon className="size-6" />
              </a>
              <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" className={linkClass}>
                <YouTubeIcon className="size-7" />
              </a>
            </div>
          </nav>
        </div>

        <div className="flex w-full flex-col items-start justify-between gap-5 border-t border-[color-mix(in_srgb,var(--color-cream)_25%,transparent)] pt-7 text-xs text-[color-mix(in_srgb,var(--color-cream)_78%,transparent)] sm:flex-row sm:items-center sm:gap-4">
          <p>
            © {year} {BRAND.fullName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 sm:justify-end">
            {[
              { href: '/legal/terms', label: 'Terms' },
              { href: '/legal/privacy', label: 'Privacy' },
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
