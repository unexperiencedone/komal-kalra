'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Clock, Lock, ShieldCheck, Video, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { bookingDetailsSchema, type BookingDetailsInput } from '@/lib/validation/schemas';
import { formatPaise } from '@/lib/money';
import { formatLongDay, formatTime } from '@/lib/date';
import { POLICY, BRAND } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea, Checkbox } from '@/components/ui/field';
import { InlineAlert, ErrorState } from '@/components/ui/states';
import { SlotPicker } from './SlotPicker';
import { BookingStepper, type BookingStepName } from './BookingStepper';
import { BookingSummary } from './BookingSummary';
import { HoldTimer } from './HoldTimer';
import { cn } from '@/lib/utils';
import type { DaySlots } from '@/lib/booking/availability';
import type { Service } from '@/types/database';
import type { RazorpayHandlerResponse } from '@/types/razorpay';

/**
 * The booking flow.
 *
 * ONE ROUTE, three steps, no page navigations. Conversion research is
 * consistent that a single-page checkout reduces abandonment by roughly 20%
 * versus a multi-page one, and that 2–3 steps with 7–8 fields is the target
 * shape (docs/research.md §3.1).
 *
 * Order of operations, and why:
 *   1. Service and time first, WITHOUT requiring an account. Forcing signup
 *      before someone can see whether you are free loses buyers.
 *   2. Selecting a time creates a server-side hold immediately, with a visible
 *      countdown. This is what stops two people paying for the same slot.
 *   3. Details, then payment. Sign-in is required only at the payment step,
 *      because that is the first point where identity genuinely matters.
 *
 * The Razorpay Checkout script is loaded `lazyOnload` and ONLY on this route —
 * it is ~90 KB and has no business on the homepage.
 */

type Step = 'time' | 'details' | 'paying';

/**
 * The design shows four steps; this flow has three internal states because
 * service selection and time selection happen on the same screen. Mapping here
 * rather than adding a fourth state keeps the state machine honest — there is
 * no separate "selection" step to be in.
 */
const STEP_LABEL: Record<Step, BookingStepName> = {
  time: 'Schedule',
  details: 'Details',
  paying: 'Payment',
};

interface HoldState { id: string; startsAt: string; endsAt: string; expiresAt: string }

const MODE_ICON = { video: Video, phone: PhoneIcon, in_person: MapPin } as const;

export function BookingFlow({
  services,
  initialServiceId,
  defaults,
  taxBps,
}: {
  services: Service[];
  initialServiceId?: string;
  /**
   * Prefilled from the profile when someone happens to be signed in, and empty
   * otherwise. There is no longer a `signedIn` flag: nothing in this flow
   * branches on it, because booking no longer requires an account.
   */
  defaults: { fullName: string; email: string; phone: string };
  taxBps: number;
}) {
  const router = useRouter();

  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? '');
  const [step, setStep] = useState<Step>('time');
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hold, setHold] = useState<HoldState | null>(null);
  const [holdPending, setHoldPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const form = useForm<BookingDetailsInput>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      fullName: defaults.fullName,
      email: defaults.email,
      phone: defaults.phone,
      subjectName: '',
      birthDate: '',
      birthTime: '',
      birthPlace: '',
      birthTimeKnown: true,
      question: '',
      couponCode: '',
      acceptTerms: undefined as unknown as true,
    },
  });

  const birthTimeKnown = form.watch('birthTimeKnown');

  // ---- Load availability --------------------------------------------------
  const loadSlots = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setSlotsError(false);
    try {
      const from = new Date();
      from.setDate(from.getDate() + weekOffset * 14);
      const response = await fetch(
        `/api/bookings/slots?serviceId=${serviceId}&from=${from.toISOString()}&days=14`,
        { cache: 'no-store' },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error('failed');
      setDays(json.data.days as DaySlots[]);
    } catch {
      setSlotsError(true);
      setDays([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, weekOffset]);

  useEffect(() => { void loadSlots(); }, [loadSlots]);

  // Changing service invalidates any existing selection: durations differ, so a
  // slot valid for a 40-minute session may not be valid for a 60-minute one.
  useEffect(() => {
    setSelectedSlot(null);
    setSelectedDate(null);
    setHold(null);
    setStep('time');
  }, [serviceId]);

  // ---- Hold ---------------------------------------------------------------
  async function selectSlot(startIso: string) {
    setError(null);
    setHoldPending(true);
    setSelectedSlot(startIso);
    try {
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, startsAt: startIso }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        // A lost race is expected under load. Refresh the calendar so the user
        // immediately sees the truth rather than an apparently-free slot.
        setSelectedSlot(null);
        setError(json.message ?? 'That time is no longer available. Please choose another.');
        void loadSlots();
        return;
      }

      setHold({
        id: json.data.holdId,
        startsAt: json.data.startsAt,
        endsAt: json.data.endsAt,
        expiresAt: json.data.expiresAt,
      });
      setStep('details');
    } catch {
      setSelectedSlot(null);
      setError('We could not reserve that time. Please check your connection and try again.');
    } finally {
      setHoldPending(false);
    }
  }

  const onHoldExpired = useCallback(() => {
    setHold(null);
    setSelectedSlot(null);
    setStep('time');
    setError('Your reservation expired. Please pick a time again — nothing has been charged.');
    void loadSlots();
  }, [loadSlots]);

  async function releaseAndGoBack() {
    if (hold) {
      // Fire-and-forget: freeing the slot for other people should not block the
      // user's navigation.
      void fetch(`/api/bookings/hold?holdId=${hold.id}`, { method: 'DELETE' });
    }
    setHold(null);
    setSelectedSlot(null);
    setStep('time');
    void loadSlots();
  }

  // ---- Pay ----------------------------------------------------------------
  async function onSubmit(values: BookingDetailsInput) {
    if (!hold || !service) return;

    // No sign-in detour. This used to bounce to /login at exactly this point —
    // after a time was chosen, birth details were typed and a slot was being
    // held — which is the worst possible place to interrupt someone. The
    // booking still gets an owner; the server derives it from the email and
    // phone already on this form. See src/lib/auth/booking-identity.ts.
    setError(null);
    setStep('paying');

    try {
      const response = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId: hold.id, serviceId: service.id, details: values }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        setError(json.message ?? 'We could not start the payment. Please try again.');
        setStep('details');
        if (json.code === 'slot_taken' || json.code === 'slot_unavailable') {
          setHold(null);
          setSelectedSlot(null);
          setStep('time');
          void loadSlots();
        }
        return;
      }

      if (!window.Razorpay) {
        setError('The payment window could not load. Please refresh and try again.');
        setStep('details');
        return;
      }

      const checkout = new window.Razorpay({
        key: json.data.keyId,
        amount: json.data.amountPaise,
        currency: json.data.currency,
        name: BRAND.fullName,
        description: service.title,
        order_id: json.data.orderId,
        prefill: json.data.prefill,
        notes: { reference: json.data.reference },
        // Razorpay's SDK takes a literal hex; it cannot read a CSS variable.
        // This is --color-saffron.
        theme: { color: '#C2762B' },
        retry: { enabled: true },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            // The user closed Checkout. Nothing has been charged, and the
            // appointment stays pending until the reconciliation sweep expires
            // it — so they can simply try again.
            setStep('details');
            setError('Payment was cancelled. Your time is still held — you can try again.');
          },
        },
        handler: async (payment: RazorpayHandlerResponse) => {
          // These values came from the browser and prove nothing on their own.
          // /api/payments/verify recomputes the HMAC server-side; the webhook
          // confirms independently. See docs/research.md §4.1–4.2.
          try {
            const verify = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment),
            });
            const result = await verify.json();

            // `t` is the capability token minted by /verify. Without it the
            // confirmation page has no way to prove this visitor is entitled
            // to see this booking, because there is no longer a session.
            const t = result.data?.accessToken ? `&t=${result.data.accessToken}` : '';

            if (result.ok && result.data.status === 'confirmed') {
              router.push(`/book/confirm?appointment=${result.data.appointmentId}${t}`);
              return;
            }
            if (result.ok && result.data.status === 'needs_attention') {
              router.push(`/book/confirm?appointment=${result.data.appointmentId}${t}&state=attention`);
              return;
            }
            // Verification did not settle it. The webhook almost certainly
            // will, so send the user to a page that polls rather than telling
            // them their payment failed when it did not.
            router.push(`/book/confirm?order=${json.data.orderId}&state=pending`);
          } catch {
            router.push(`/book/confirm?order=${json.data.orderId}&state=pending`);
          }
        },
      });

      checkout.on('payment.failed', (response) => {
        setStep('details');
        setError(
          `Payment failed: ${response.error.description}. Nothing has been charged — you can try a different method.`,
        );
      });

      checkout.open();
    } catch {
      setError('We could not reach the payment provider. Please try again.');
      setStep('details');
    }
  }

  if (!service) {
    return (
      <EmptyServices />
    );
  }

  /**
   * The first date this service can be booked for.
   *
   * Mirrors database/28_min_lead_days.sql: earliest date = today + the
   * service's `min_lead_days`. This copy is for DISPLAY ONLY — the server
   * derives the same date independently inside get_available_slots(), and that
   * is what actually decides which slots exist. If the two ever disagree the
   * calendar simply shows nothing on the day named here, which is visible; the
   * alternative, enforcing the rule in the browser, would be bypassable.
   *
   * Undefined `min_lead_days` means the migration has not run on this
   * deployment — in which case there is no day rule to explain, so say nothing.
   */
  const leadDays = service.min_lead_days;
  const earliestDate = (() => {
    if (leadDays === undefined || leadDays === null || leadDays <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + leadDays);
    return d;
  })();

  const ModeIcon = MODE_ICON[service.mode];
  const net = service.price_paise;
  const tax = Math.floor((net * taxBps) / 10_000);
  const total = net + tax;

  return (
    <>
      {/* Loaded only on this route, and only after the page is interactive. */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ------------------------------ MAIN ------------------------------ */}
        {/* min-w-0: grid items default to min-content width, which is wider
            than a phone screen once BookingStepper's four nowrap labels are
            laid out. Without this, the stepper's own overflow-x-auto never
            engages — the grid item just grows to fit it instead, and the
            whole page gains a horizontal scrollbar. */}
        <div className="min-w-0">
          <BookingStepper current={STEP_LABEL[step]} />

          {error && (
            <div className="mt-6">
              <InlineAlert tone={step === 'time' ? 'warning' : 'danger'}>{error}</InlineAlert>
            </div>
          )}

          {step === 'time' && (
            <div className="mt-8 space-y-8">
              <div>
                <h2 className="font-sans text-[15px] font-semibold">1. Choose a consultation</h2>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {services.filter((s) => s.bookable_online).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      aria-pressed={s.id === serviceId}
                      className={cn(
                        ' border p-4 text-left transition-colors',
                        s.id === serviceId
                          ? 'border-[var(--color-saffron)] bg-[var(--color-cream)]'
                          : 'border-[var(--color-outline-variant)] bg-white hover:border-[var(--color-outline-variant)]',
                        // Internal rows reach this list only for admins, and
                        // only ever appended to it. Dashed, so it cannot be
                        // mistaken for part of the catalogue at a glance.
                        s.internal && 'border-dashed',
                      )}
                    >
                      <span className="block text-sm font-semibold text-[var(--color-cocoa)]">
                        {s.title}
                      </span>
                      {/*
                        This charges real money through live keys. Labelling it
                        "test" would be a lie that costs someone a booking —
                        the payment is genuine, only the amount is trivial.
                      */}
                      {s.internal && (
                        <span className="mt-1.5 inline-block border border-[var(--color-outline-variant)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-body-warm)]">
                          Staff only · real payment
                        </span>
                      )}
                      <span className="mt-1 block text-xs text-[var(--color-body-warm)]">
                        {s.duration_minutes} min · {formatPaise(s.price_paise)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-sans text-[15px] font-semibold">2. Pick a time</h2>
                {/*
                  Says why the next few days are greyed out.

                  Without this the calendar looks broken rather than booked:
                  a visitor sees today and tomorrow disabled, assumes Komal is
                  full, and leaves. The date is computed rather than hardcoded
                  so it cannot drift from what the server will actually accept
                  if the lead time is changed in the admin console.
                */}
                {earliestDate && (
                  <p className="mb-4 mt-1.5 text-xs leading-relaxed text-[var(--color-body-warm)]">
                    Komal prepares each chart in advance, so the earliest session is{' '}
                    <strong className="font-semibold text-[var(--color-cocoa)]">
                      {formatLongDay(earliestDate)}
                    </strong>
                    . Call {BRAND.phones[0]} if you need something sooner.
                  </p>
                )}
                {!earliestDate && <div className="mb-4" />}
                {slotsError ? (
                  <ErrorState
                    title="Could not load available times"
                    description="This is usually a temporary connection problem."
                    onRetry={() => void loadSlots()}
                    action={
                      <Button asChild variant="ghost" size="sm">
                        <a href={`tel:${BRAND.phonesE164[0]}`}>Call us instead</a>
                      </Button>
                    }
                  />
                ) : (
                  <SlotPicker
                    days={days}
                    loading={loadingSlots}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSelectDate={setSelectedDate}
                    onSelectSlot={(iso) => void selectSlot(iso)}
                    weekOffset={weekOffset}
                    onWeekChange={setWeekOffset}
                    disabled={holdPending}
                  />
                )}
              </div>
            </div>
          )}

          {(step === 'details' || step === 'paying') && hold && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => void releaseAndGoBack()}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-body-warm)] hover:text-[var(--color-cocoa)]"
              >
                <ArrowLeft className="size-3.5" aria-hidden /> Choose a different time
              </button>

              <div className="mb-6">
                <HoldTimer expiresAt={hold.expiresAt} onExpire={onHoldExpired} />
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
                <fieldset disabled={step === 'paying'} className="space-y-5">
                  <legend className="font-sans text-[15px] font-semibold">3. Your details</legend>

                  <Field label="Full name" htmlFor="b-name" required error={form.formState.errors.fullName?.message}>
                    <Input {...form.register('fullName')} autoComplete="name" />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email" htmlFor="b-email" required error={form.formState.errors.email?.message}>
                      <Input {...form.register('email')} type="email" autoComplete="email" inputMode="email" />
                    </Field>
                    {/*
                      The hint is not decoration. Under the DPDP Act the person
                      has to know what a piece of personal data will be used
                      for at the point they give it, and "we will message this
                      number on WhatsApp" is a use they would not otherwise
                      assume from a field labelled "Phone".
                    */}
                    <Field
                      label="Phone"
                      htmlFor="b-phone"
                      required
                      hint="Your booking details are sent to this number on WhatsApp."
                      error={form.formState.errors.phone?.message}
                    >
                      <Input {...form.register('phone')} type="tel" autoComplete="tel" inputMode="tel" />
                    </Field>
                  </div>

                  {/*
                    Said plainly, where the decision is made. Someone who has
                    been asked to create an account on three other sites this
                    week will assume they are about to be asked again, and that
                    assumption is itself a reason to abandon.
                  */}
                  <p className="text-xs leading-relaxed text-[var(--color-body-warm)]">
                    No account or password needed — just pay and you are booked.
                  </p>
                </fieldset>

                <fieldset disabled={step === 'paying'} className="space-y-5  border border-[var(--color-outline-variant)] bg-white p-5">
                  <legend className="px-1.5 text-sm font-semibold">Birth details</legend>
                  <p className="text-xs leading-relaxed text-[var(--color-body-warm)]">
                    Optional, but the more Komal has beforehand the more useful the session
                    will be. These details are private and visible only to her.
                  </p>

                  <Field
                    label="Whose chart is this?"
                    htmlFor="b-subject"
                    hint="Leave blank if it is your own."
                    error={form.formState.errors.subjectName?.message}
                  >
                    <Input {...form.register('subjectName')} placeholder="Name" autoComplete="off" />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Date of birth" htmlFor="b-bdate" error={form.formState.errors.birthDate?.message}>
                      <Input {...form.register('birthDate')} type="date" />
                    </Field>
                    <Field label="Time of birth" htmlFor="b-btime" error={form.formState.errors.birthTime?.message}>
                      <Input {...form.register('birthTime')} type="time" disabled={!birthTimeKnown} />
                    </Field>
                  </div>

                  {/* "I do not know" is a first-class answer. Demanding an exact
                      birth time from someone who does not have it is a real
                      abandonment cause in this category. */}
                  <Checkbox
                    id="b-timeknown"
                    label="I am not sure of the exact birth time"
                    checked={!birthTimeKnown}
                    onChange={(e) => form.setValue('birthTimeKnown', !e.target.checked)}
                  />

                  <Field label="Place of birth" htmlFor="b-bplace" error={form.formState.errors.birthPlace?.message}>
                    <Input {...form.register('birthPlace')} placeholder="City, state or country" autoComplete="off" />
                  </Field>
                </fieldset>

                <fieldset disabled={step === 'paying'} className="space-y-5">
                  <Field
                    label="What would you like to discuss?"
                    htmlFor="b-question"
                    hint="A couple of sentences helps Komal prepare."
                    error={form.formState.errors.question?.message}
                  >
                    <Textarea {...form.register('question')} rows={4} />
                  </Field>

                  <Field label="Discount code" htmlFor="b-coupon" error={form.formState.errors.couponCode?.message}>
                    <Input {...form.register('couponCode')} placeholder="If you have one" className="uppercase" autoCapitalize="characters" />
                  </Field>

                  <div>
                    <Checkbox
                      id="b-terms"
                      {...form.register('acceptTerms')}
                      label={
                        <>
                          I have read the{' '}
                          <Link href="/legal/refunds" target="_blank" className="underline hover:text-[var(--color-saffron-deep)]">
                            cancellation and refund policy
                          </Link>{' '}
                          and the{' '}
                          <Link href="/legal/terms" target="_blank" className="underline hover:text-[var(--color-saffron-deep)]">
                            terms of service
                          </Link>.
                        </>
                      }
                    />
                    {form.formState.errors.acceptTerms && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
                        {form.formState.errors.acceptTerms.message}
                      </p>
                    )}
                  </div>
                </fieldset>

                <Button
                  type="submit"
                  size="lg"
                  full
                  loading={step === 'paying'}
                  loadingText="Opening secure payment…"
                  disabled={!scriptReady && step !== 'paying'}
                >
                  Pay {formatPaise(total)} securely
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-body-warm)]">
                  <Lock className="size-3" aria-hidden />
                  Payment is processed by Razorpay. Your card details never reach our servers.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* --------------------------- SUMMARY ---------------------------- */}
        <BookingSummary
          service={service}
          startsAt={hold?.startsAt}
          endsAt={hold?.endsAt}
          totalPaise={total}
          taxPaise={tax}
        />
      </div>
    </>
  );
}

function EmptyServices() {
  return (
    <div className="border border-dashed border-[var(--color-outline-variant)] p-12 text-center">
      <p className="font-sans text-[15px] font-semibold">No consultations are open for booking</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-body-warm)]">
        Please call us and we will arrange a time directly.
      </p>
      <Button asChild variant="secondary" size="sm" className="mt-5">
        <a href={`tel:${BRAND.phonesE164[0]}`}>Call {BRAND.phones[0]}</a>
      </Button>
    </div>
  );
}
