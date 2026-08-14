import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { getActiveServices } from '@/lib/booking/availability';
import { getProfile } from '@/lib/auth/session';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Book a consultation',
  description: 'Choose a consultation, pick a time and confirm your booking online.',
  // Application surface. Indexing a booking funnel produces thin duplicate
  // pages and competes with the service pages that should rank instead.
  robots: { index: false, follow: true },
};

/**
 * Booking route.
 *
 * The server does the data fetching (services, profile, tax rate) and hands the
 * client component everything it needs, so the interactive flow starts with the
 * summary card already populated rather than flashing empty.
 *
 * TAX_BPS is read server-side and passed down: the client renders it, but the
 * amount charged is always recomputed on the server at order time. The value
 * here is for display only and cannot influence what is charged.
 */
export default async function BookPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 16: searchParams is a Promise with no synchronous fallback.
  const searchParams = await props.searchParams;
  const [services, profile] = await Promise.all([getActiveServices(), getProfile()]);

  const requestedSlug = typeof searchParams.service === 'string' ? searchParams.service : undefined;
  const initial = services.find((s) => s.slug === requestedSlug)?.id;

  return (
    <div className="min-h-dvh bg-[var(--color-sand)]">
      <header className="border-b border-[var(--color-linen)] bg-[var(--color-sand)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bark)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> {BRAND.fullName}
          </Link>
          <a
            href={`tel:${BRAND.phonesE164[0]}`}
            className="text-sm font-medium text-[var(--color-bark)] hover:text-[var(--color-ink)]"
          >
            {BRAND.phones[0]}
          </a>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <h1 className="text-[length:var(--text-h1)]">Book your consultation</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-bark)]">
          Pick a time that suits you. Your slot is held while you complete the booking, and
          you can cancel free of charge up to 24 hours beforehand.
        </p>

        <div className="mt-10">
          <BookingFlow
            services={services}
            initialServiceId={initial}
            signedIn={Boolean(profile)}
            defaults={{
              fullName: profile?.full_name ?? '',
              email: profile?.email ?? '',
              phone: profile?.phone ?? '',
            }}
            taxBps={Number(process.env.TAX_BPS ?? 0)}
          />
        </div>
      </main>
    </div>
  );
}
