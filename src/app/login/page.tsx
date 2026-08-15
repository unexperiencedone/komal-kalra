import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Lock } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { Skeleton } from '@/components/ui/states';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Sign in',
  // Application surface, not content. Indexing a login page produces a thin
  // result and gives an attacker a discovery path.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bark)] transition-colors hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to site
        </Link>

        <main id="main" className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm">
            <Suspense fallback={<LoginSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </main>

        <p className="flex items-center gap-1.5 text-xs text-[var(--color-stone)]">
          <Lock className="size-3" aria-hidden />
          Your details are encrypted in transit and never shared.
        </p>
      </div>

      {/* Brand column — decorative, hidden on mobile where it would only push
          the form below the fold. */}
      <aside
        aria-hidden
        className="band-night constellation-motif-dark relative hidden flex-col justify-between p-16 lg:flex"
      >
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-sand)]">
          {BRAND.fullName}
        </p>
        <div>
          <blockquote className="max-w-md font-[family-name:var(--font-display)] text-[28px] leading-snug text-[var(--color-sand)]">
            &ldquo;{BRAND.tagline}&rdquo;
          </blockquote>
          <p className="mt-6 max-w-md text-sm leading-relaxed">
            Sign in to see your upcoming consultations, download receipts, and manage
            your bookings.
          </p>
        </div>
      </aside>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading sign in form">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-[52px] w-full" />
    </div>
  );
}
