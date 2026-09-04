'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import { img, type ImageKey } from '@/lib/content/imagery';
import { BRAND } from '@/lib/config';
import { LoginForm, type Mode } from './LoginForm';
import { Skeleton } from '@/components/ui/states';

/**
 * The brand column's photograph and blurb per mode — reset shares Sign in's,
 * since it is reached from there and never has its own tab.
 */
const VISUAL: Record<Mode, { image: ImageKey; blurb: string }> = {
  signin: {
    image: 'signInImage',
    blurb: 'Sign in to see your upcoming consultations, download receipts and manage your bookings.',
  },
  signup: {
    image: 'createAccountImage',
    blurb: 'Create an account to confirm a booking and keep a record of every consultation.',
  },
  reset: {
    image: 'signInImage',
    blurb: 'Sign in to see your upcoming consultations, download receipts and manage your bookings.',
  },
};

/**
 * Owns `mode` so the brand-column photograph switches together with the form
 * instead of the two drifting apart — see LoginForm.tsx.
 */
export function LoginExperience() {
  const [mode, setMode] = useState<Mode>('signin');
  const visual = VISUAL[mode];
  const photo = img(visual.image);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* --------------------------- Form column --------------------------- */}
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-20">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-[var(--color-cocoa)] sm:text-2xl"
        >
          <Image src="/images/favicon_new.png" alt="" width={32} height={32} className="size-8" />
          {BRAND.name}
        </Link>

        <main id="main" className="flex flex-1 items-center py-16">
          <div className="mx-auto w-full max-w-sm">
            <Suspense fallback={<LoginSkeleton />}>
              <LoginForm mode={mode} onModeChange={setMode} />
            </Suspense>
          </div>
        </main>

        <p className="label-small flex items-center gap-2 text-[var(--color-body-warm)]">
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
          key={visual.image}
          src={photo.src}
          alt=""
          fill
          sizes="50vw"
          className="object-cover grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-[var(--color-cocoa)]/70" />
        <div className="relative flex h-full flex-col justify-end p-16">
          <span className="gold-rule" />
          <blockquote className="mt-8 max-w-md font-[family-name:var(--font-display)] text-3xl leading-snug text-[var(--color-card-cream)]">
            {BRAND.tagline}
          </blockquote>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-on-primary-container)]">
            {visual.blurb}
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
