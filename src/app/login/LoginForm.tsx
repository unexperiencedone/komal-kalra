'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { signIn, signUp, requestPasswordReset, type AuthState } from './actions';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup' | 'reset';

/**
 * The single login surface.
 *
 * ONE route, three modes. There is no /admin-login and no /user-login — where
 * a user lands after authenticating is decided server-side from their database
 * role (see actions.ts → destinationFor).
 *
 * `useActionState` keeps the form working without JavaScript: the server
 * actions are real form posts, so a failed hydration degrades to a normal
 * form submission rather than a dead page.
 */
export function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>('signin');
  const next = params.get('next') ?? '';
  const linkError = params.get('error');

  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, null);
  const [resetState, resetAction, resetting] = useActionState<AuthState, FormData>(requestPasswordReset, null);

  const state = mode === 'signin' ? signInState : mode === 'signup' ? signUpState : resetState;
  const pending = signingIn || signingUp || resetting;

  if (mode === 'reset') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bark)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
        </button>

        <h1 className="text-[length:var(--text-h2)]">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark)]">
          Enter your email and we will send you a link to set a new password.
        </p>

        <form action={resetAction} className="mt-7 space-y-5">
          {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}
          {state?.success && <InlineAlert tone="success">{state.success}</InlineAlert>}

          <Field label="Email" htmlFor="reset-email" required>
            <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </Field>

          <Button type="submit" size="lg" full loading={resetting} loadingText="Sending…">
            Send reset link
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[length:var(--text-h2)]">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark)]">
        {mode === 'signin'
          ? 'Sign in to see your consultations, receipts and upcoming sessions.'
          : 'You need an account to confirm a booking and keep your session history.'}
      </p>

      {/* Mode switch. Both modes post to the same route — see actions.ts. */}
      <div
        role="tablist"
        aria-label="Sign in or create an account"
        className="mt-7 grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-[var(--color-linen)] p-1"
      >
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-[calc(var(--radius-control)-2px)] py-2 text-sm font-medium transition-colors',
              mode === m ? 'bg-white text-[var(--color-ink)] shadow-[var(--shadow-resting)]' : 'text-[var(--color-bark)]',
            )}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {linkError && (
        <div className="mt-5">
          <InlineAlert tone="danger">
            {linkError === 'invalid_link'
              ? 'That link has expired or has already been used. Please request a new one.'
              : 'We could not complete that sign in. Please try again.'}
          </InlineAlert>
        </div>
      )}

      {mode === 'signin' ? (
        <form action={signInAction} className="mt-6 space-y-5">
          <input type="hidden" name="next" value={next} />
          {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}

          <Field label="Email" htmlFor="signin-email" required>
            <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </Field>

          <Field label="Password" htmlFor="signin-password" required>
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>

          <button
            type="button"
            onClick={() => setMode('reset')}
            className="text-sm font-medium text-[var(--color-ember-text)] hover:underline"
          >
            Forgotten your password?
          </button>

          <Button type="submit" size="lg" full loading={pending} loadingText="Signing in…">
            Sign in
          </Button>
        </form>
      ) : (
        <form action={signUpAction} className="mt-6 space-y-5">
          <input type="hidden" name="next" value={next} />
          {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}
          {state?.success && <InlineAlert tone="success">{state.success}</InlineAlert>}

          <Field label="Full name" htmlFor="signup-name" required error={state?.fields?.fullName}>
            <Input name="fullName" autoComplete="name" required placeholder="Your name" />
          </Field>

          <Field label="Email" htmlFor="signup-email" required error={state?.fields?.email}>
            <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </Field>

          <Field
            label="Phone"
            htmlFor="signup-phone"
            required
            error={state?.fields?.phone}
            hint="Used only to reach you about your consultation."
          >
            <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="98765 43210" />
          </Field>

          <Field
            label="Password"
            htmlFor="signup-password"
            required
            error={state?.fields?.password}
            hint="At least 8 characters. A short phrase works better than a complicated word."
          >
            <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
          </Field>

          <Button type="submit" size="lg" full loading={pending} loadingText="Creating account…">
            Create account
          </Button>

          <p className="text-xs leading-relaxed text-[var(--color-stone)]">
            By creating an account you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-[var(--color-ember-text)]">terms</Link> and{' '}
            <Link href="/legal/privacy" className="underline hover:text-[var(--color-ember-text)]">privacy policy</Link>.
          </p>
        </form>
      )}
    </div>
  );
}
