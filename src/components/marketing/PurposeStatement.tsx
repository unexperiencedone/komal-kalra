import Link from 'next/link';
import { BRAND } from '@/lib/config';

/**
 * "About this service" — the plain-language description of what this
 * application does, who it is for, and exactly what signing in with Google
 * gives it access to.
 *
 * WHY THIS SECTION EXISTS
 *
 * Google's OAuth verification review rejected the app with:
 *
 *   "Your homepage does not explain the purpose of your app."
 *
 * That is a fair reading. Everything above this point is written to persuade a
 * prospective client — "Clarity for the Curated Life" tells you how a session
 * feels, not what the software does. A reviewer arrives cold, does not sign in,
 * and needs to answer three questions from the homepage alone:
 *
 *   1. What is this application?
 *   2. Why does it ask for my Google account?
 *   3. Where are the terms and the privacy policy?
 *
 * Google's published homepage requirements are explicit that the page must
 * describe the app's functionality, must be reachable without logging in, and
 * must link the terms and privacy policy. So this block is written flatly and
 * literally, and it opens with the app name spelled out in full — that name
 * has to match the OAuth consent screen character for character, and the
 * mismatch was the third rejection reason.
 *
 * It is also simply true and useful. A first-time visitor wondering "do I have
 * to make an account to see prices?" gets a straight answer, which the
 * marketing copy above never gives them.
 *
 * ACCURACY IS LOAD-BEARING HERE
 *
 * Every claim below is checked against the code, not aspirational:
 *   • Browsing and slot selection genuinely need no account — `BookPage`
 *     tolerates a null profile and `BookingFlow` only redirects to /login at
 *     the payment step.
 *   • The scope list is what `signInWithOAuth` actually requests. No `scopes`
 *     option is passed, so Supabase sends Google's defaults: openid, email,
 *     profile. Nothing else. If a scope is ever added, this paragraph must
 *     change in the same commit — an overstated or understated disclosure here
 *     is worse than none, and is itself grounds for rejection.
 */
export function PurposeStatement() {
  return (
    <section
      aria-labelledby="purpose-heading"
      className="band-sand py-[var(--spacing-section-md)]"
    >
      <div className="shell grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label-caps text-[var(--color-saffron-deep)]">About this service</p>
          <div className="w-fit">
            <h2 id="purpose-heading" className="mt-4 text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
              What this website does
            </h2>
            <span className="gold-rule mt-6 !w-[calc(100%+1rem)]" aria-hidden />
          </div>
        </div>

        <div className="space-y-6 text-base leading-relaxed text-[var(--color-body-warm)] md:col-span-7 md:col-start-6">
          <p>
            <strong className="font-medium text-[var(--color-cocoa)]">{BRAND.fullName}</strong>{' '}
            is the online booking service for private, one-to-one consultations with Komal Kalra,
            an astrologer, life coach and counsellor practising in India. It is not an app store
            product or a horoscope generator: it is the place you read about each consultation,
            see its fee and length, choose a time from her real availability, pay for the session
            and receive your joining details.
          </p>

          <p>
            You can browse every service, see every price and pick a time{' '}
            <strong className="font-medium text-[var(--color-cocoa)]">without an account</strong>.
            An account is only needed at the point of payment, because a paid booking has to belong
            to someone — and afterwards it is how you view, reschedule or cancel your session and
            download your receipt.
          </p>

          <div className="border-l-2 border-[var(--color-saffron)] pl-6">
            <h3 className="label-caps text-[var(--color-cocoa)]">
              If you sign in with Google
            </h3>
            <p className="mt-4">
              Choosing <em>Continue with Google</em> is optional — email and password works just as
              well. If you do use it, we receive three things from your Google Account:{' '}
              <strong className="font-medium text-[var(--color-cocoa)]">
                your name, your email address and your profile picture
              </strong>
              . They are used to create your account, to show you your own bookings and to send
              your booking confirmations and reminders.
            </p>
            <p className="mt-4">
              We do not request access to Gmail, Drive, Contacts, Calendar, Photos or any other
              Google service, we never post or send anything on your behalf, and we do not sell or
              share this information. You can withdraw access at any time from your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--color-saffron)] underline-offset-4 transition-colors hover:text-[var(--color-cocoa)]"
              >
                Google Account permissions page
              </a>
              , or ask us to delete your account entirely.
            </p>
          </div>

          <p>
            The full detail is in our{' '}
            <Link
              href="/legal/privacy"
              className="underline decoration-[var(--color-saffron)] underline-offset-4 transition-colors hover:text-[var(--color-cocoa)]"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/legal/terms"
              className="underline decoration-[var(--color-saffron)] underline-offset-4 transition-colors hover:text-[var(--color-cocoa)]"
            >
              Terms of Service
            </Link>
            . Consultations are for guidance and personal reflection and are not a substitute for
            medical, psychological, legal or financial advice.
          </p>
        </div>
      </div>
    </section>
  );
}
