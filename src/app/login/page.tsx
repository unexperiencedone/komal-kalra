import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import { img } from '@/lib/content/imagery';
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
  const portrait = img('practitionerPortrait');

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* --------------------------- Form column --------------------------- */}
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-20">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-[var(--color-cosmic-navy)]"
        >
          {BRAND.name}
        </Link>

        <main id="main" className="flex flex-1 items-center py-16">
          <div className="mx-auto w-full max-w-sm">
            <Suspense fallback={<LoginSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </main>

        <p className="label-small flex items-center gap-2 text-[var(--color-on-surface-variant)]">
          <Lock className="size-3" aria-hidden />
          Your details are encrypted in transit and never shared.
        </p>
      </div>

      {/*
        Brand column. Hidden below lg — on a phone it would push the form below
        the fold, and the form is the only thing on this page that does a job.
      */}
      <aside aria-hidden className="relative hidden overflow-hidden lg:block">
        <Image
          src={portrait.src}
          alt=""
          fill
          sizes="50vw"
          className="object-cover grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-[var(--color-cosmic-navy)]/70" />
        <div className="relative flex h-full flex-col justify-end p-16">
          <span className="gold-rule" />
          <blockquote className="mt-8 max-w-md font-[family-name:var(--font-display)] text-3xl leading-snug text-[var(--color-warm-ivory)]">
            {BRAND.tagline}
          </blockquote>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-on-primary-container)]">
            Sign in to see your upcoming consultations, download receipts and manage your
            bookings.
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
