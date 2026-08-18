import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/config';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-saffron-deep)]">404</p>
      <h1 className="mt-4 text-[length:var(--text-h1)]">This page does not exist</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-body-warm)]">
        The link may be out of date, or the page may have moved. Everything else is where you
        left it.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild><Link href="/">Back to the homepage</Link></Button>
        <Button asChild variant="secondary"><Link href="/services">Browse consultations</Link></Button>
      </div>
      <p className="mt-8 text-sm text-[var(--color-body-warm)]">
        Looking for something specific? Call{' '}
        <a href={`tel:${BRAND.phonesE164[0]}`} className="font-medium text-[var(--color-saffron-deep)] hover:underline">
          {BRAND.phones[0]}
        </a>
      </p>
    </div>
  );
}
