import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { getActiveServices, getInternalServices } from '@/lib/booking/availability';
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
  const [catalogue, profile] = await Promise.all([getActiveServices(), getProfile()]);

  /**
   * Staff-only services (currently just the ₹1 payment verification booking)
   * are appended for administrators and for nobody else.
   *
   * The role is read from the PROFILE on the server, never from anything the
   * browser sent. Two independent things have to be true for these rows to
   * appear: this check, and the row-level security policy, which returns
   * nothing for a non-admin because `getInternalServices` uses the cookie-
   * scoped client rather than the service-role one. Defeating the UI check
   * alone gets you an empty array.
   *
   * Appended last, and never made the default selection — `initial` only ever
   * resolves against the public catalogue, so /book?service=guidance-
   * verification will not preselect it. That is deliberate: the verification
   * service should require a conscious click.
   */
  const internal = profile?.role === 'admin' ? await getInternalServices() : [];
  const services = [...catalogue, ...internal];

  const requestedSlug = typeof searchParams.service === 'string' ? searchParams.service : undefined;
  const initial = catalogue.find((s) => s.slug === requestedSlug)?.id;

  return (
    <div className="min-h-dvh bg-[var(--color-card-cream)]">
      {/*
        Booking chrome is deliberately stripped back — wordmark and an exit,
        nothing else. The design removes the full navigation here because every
        link in it is a way to abandon a checkout that already has a slot held.
      */}
      <header className="border-b border-[var(--color-hairline)]">
        <div className="shell flex h-20 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-[var(--color-cocoa)] sm:text-2xl"
          >
            <Image src="/images/favicon.png" alt="" width={32} height={32} className="size-8" />
            {BRAND.name}
          </Link>
          <Link
            href="/"
            className="label-caps inline-flex items-center gap-2 text-[var(--color-body-warm)] transition-colors hover:text-[var(--color-cocoa)]"
          >
            <X className="size-4" aria-hidden />
            Exit Booking
          </Link>
        </div>
      </header>

      <main id="main" className="shell py-12 lg:py-16">
        <h1 className="sr-only">Book your consultation</h1>

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
      </main>
    </div>
  );
}
