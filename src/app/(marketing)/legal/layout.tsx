import Link from 'next/link';
import { LEGAL_INDEX } from '@/lib/content/legal';

/**
 * Legal shell.
 *
 * Cross-links all four documents at the foot of each, because someone reading
 * the refund policy is quite likely to want the terms next, and making them
 * navigate back to the footer to find it is needless friction.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="band-ivory py-[var(--spacing-section-md)]">
      <div className="shell max-w-4xl">
        {children}

        <nav
          aria-label="Other legal documents"
          className="mt-20 border-t border-[var(--color-hairline)] pt-10"
        >
          <p className="label-caps text-[var(--color-body-warm)]">Also see</p>
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {LEGAL_INDEX.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  className="text-[15px] text-[var(--color-cocoa)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--color-saffron-deep)]"
                >
                  {d.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="text-[15px] text-[var(--color-cocoa)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--color-saffron-deep)]"
              >
                Contact us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
