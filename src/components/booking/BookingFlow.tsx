'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Clock, Lock, MessageCircle, ShieldCheck, Video, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { bookingDetailsSchema, type BookingDetailsInput } from '@/lib/validation/schemas';
import { formatPaise, publicPrice } from '@/lib/money';
import {
  formatLongDay,
  formatTime,
  businessToday,
  addDaysToKey,
  monthOfKey,
  monthStartKey,
  monthEndKey,
  daysBetweenKeys,
} from '@/lib/date';

/** Calendar-date min/max. Plain string compare is correct for YYYY-MM-DD. */
const maxKey = (a: string, b: string) => (a > b ? a : b);
const minKey = (a: string, b: string) => (a < b ? a : b);
import { POLICY, BRAND, BOOKING_MODE } from '@/lib/config';
import { buildEnquiryMessage, enquiryLink } from '@/lib/booking/whatsapp-message';
import { useT } from '@/lib/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
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
  const [days, setDays] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hold, setHold] = useState<HoldState | null>(null);
  const [holdPending, setHoldPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * WhatsApp mode: the deep link has been opened. NOT "sent" — opening WhatsApp
   * only fills the compose box, and nothing here can observe whether the
   * visitor pressed send. Naming this `sent` would be the beginning of a UI
   * that lies about it.
   */
  const [handedOff, setHandedOff] = useState(false);

  const t = useT();
  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const form = useForm<BookingDetailsInput>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      fullName: defaults.fullName,
      email: defaults.email,
      phone: defaults.phone,
      birthDate: '',
      birthTime: '',
      birthCity: '',
      birthState: '',
      birthCountry: '',
      birthTimeKnown: true,
      acceptTerms: undefined as unknown as true,
    },
  });

  const birthTimeKnown = form.watch('birthTimeKnown');

  /* ---- Date window --------------------------------------------------------
   *
   * All of this is computed from the BUSINESS timezone, not the browser's.
   * `new Date()` plus `setDate()` resolves in whatever zone the visitor's device
   * is set to, so for anyone west of IST it can land a day early — and offering
   * a date the server will then refuse is worse than not offering it.
   *
   * These bounds are for RENDERING ONLY. get_available_slots() derives the same
   * limits independently in Postgres, and that is what decides which slots
   * exist. If the two ever disagree the calendar shows an empty day, which is
   * visible; enforcing the rule only here would make it bypassable.
   */
  const today = useMemo(() => businessToday(), []);

  /** First date this service can be booked for. */
  const earliestKey = useMemo(
    () => addDaysToKey(today, service?.min_lead_days ?? 0),
    [today, service?.min_lead_days],
  );

  /** Last date, from the service's own max_advance_days. */
  const latestKey = useMemo(
    () => addDaysToKey(today, service?.max_advance_days ?? 60),
    [today, service?.max_advance_days],
  );

  const [month, setMonth] = useState<string>(() => monthOfKey(earliestKey));

  // Follow the lead time when it moves — switching service can change it, and
  // the calendar must not open on a month the service cannot be booked in.
  useEffect(() => {
    setMonth((m) => (m < monthOfKey(earliestKey) ? monthOfKey(earliestKey) : m));
  }, [earliestKey]);

  // ---- Load availability --------------------------------------------------
  const loadSlots = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setSlotsError(false);
    try {
      /*
       * Fetch the MONTH ON SCREEN, clamped to the bookable range.
       *
       * This replaces a fixed "14 days from today" window, which was the actual
       * bug behind the dead calendar: the grid renders a whole month, so
       * everything past day 14 had no slots to show and rendered disabled, and
       * paging to the next month showed a grid where every day was greyed out.
       * A visitor cannot tell that apart from "she is fully booked".
       */
      const from = maxKey(monthStartKey(month), earliestKey);
      const to = minKey(monthEndKey(month), latestKey);
      const span = daysBetweenKeys(from, to);

      // The whole visible month is out of range. Nothing to ask the server for.
      if (span < 0) {
        setDays([]);
        return;
      }

      const response = await fetch(
        `/api/bookings/slots?serviceId=${serviceId}&from=${from}&days=${span}`,
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
  }, [serviceId, month, earliestKey, latestKey]);

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

    /*
     * WhatsApp mode writes nothing to the database, so there is no hold to
     * create — the visitor is asking for a time, not reserving one.
     *
     * This is why every label in this mode says "requested". Calling /hold here
     * would put a row in slot_holds that blocks the calendar for ten minutes on
     * behalf of someone who may never send the message, and would imply a
     * reservation the practice has not agreed to.
     */
    if (BOOKING_MODE === 'whatsapp') {
      setSelectedSlot(startIso);
      setStep('details');
      return;
    }

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

  // ---- Submit -------------------------------------------------------------
  async function onSubmit(values: BookingDetailsInput) {
    if (!service) return;

    /*
     * WHATSAPP MODE: format the details and hand off. No network call of any
     * kind, no database write, no payment.
     *
     * `window.open` is called SYNCHRONOUSLY inside this handler, still within
     * the user-gesture window. Building the URL after an await would lose that
     * gesture and every mobile browser would block the popup — the visitor
     * would press the button and watch nothing happen.
     */
    if (BOOKING_MODE === 'whatsapp') {
      const message = buildEnquiryMessage({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        serviceTitle: service.title,
        requestedAt: selectedSlot
          ? `${formatLongDay(selectedSlot)}, ${formatTime(selectedSlot)} IST`
          : null,
        birthDate: values.birthDate,
        birthTime: values.birthTime,
        birthTimeKnown: values.birthTimeKnown,
        birthPlace: [values.birthCity, values.birthState, values.birthCountry]
          .filter(Boolean)
          .join(', '),
      });

      window.open(enquiryLink(message), '_blank', 'noopener,noreferrer');

      // Deliberately NOT "sent". Opening WhatsApp only fills the compose box,
      // and nothing here can observe whether the visitor pressed send. The
      // panel this triggers tells them to.
      setHandedOff(true);
      return;
    }

    if (!hold) return;

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
  /*
    Whether to explain the lead time at all.
    `earliestKey` is already computed in the business timezone above — the
    previous version built this date with `new Date()` + `setDate()`, which
    resolves in the visitor's own zone and could therefore name a date one day
    off from the one the server would actually accept.
  */
  const showsLeadNote = (service.min_lead_days ?? 0) > 0;

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
              {/*
                Explains the whole flow BEFORE the first field, because it is
                not the flow anyone expects. A visitor who reaches the end
                assuming they were about to pay, and instead gets handed to
                WhatsApp, has to work out what just happened — and some of them
                will decide it went wrong and leave. Four numbered lines up
                front costs nothing and removes that entirely.
              */}
              {BOOKING_MODE === 'whatsapp' && (
                <div className="border border-[var(--color-outline-variant)] bg-white p-5">
                  <h2 className="font-sans text-[15px] font-semibold text-[var(--color-cocoa)]">
                    {t('book.wa.howItWorks')}
                  </h2>
                  <ol className="mt-3 space-y-1.5 text-sm leading-relaxed text-[var(--color-body-warm)]">
                    <li>1. {t('book.wa.step.fill')}</li>
                    <li>2. {t('book.wa.step.open')}</li>
                    <li>
                      3.{' '}
                      <strong className="font-semibold text-[var(--color-cocoa)]">
                        {t('book.wa.step.send')}
                      </strong>
                    </li>
                    <li>4. {t('book.wa.step.confirm')}</li>
                  </ol>

                  {/*
                    The escape hatch, offered up front rather than buried at the
                    end. Some people arrive not knowing which session they need,
                    and for them the form is an obstacle course guarding the
                    thing they actually want — a conversation. Making them fill
                    in a birth date to ask a question loses them.

                    Deliberately quieter than the primary path: a link, not a
                    second button of equal weight. The form produces a message
                    Komal can act on immediately, so it stays the default.
                  */}
                  <div className="mt-5 flex items-center gap-3 border-t border-[var(--color-outline-variant)] pt-4">
                    <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-body-warm)]">
                      {t('book.wa.or')}
                    </span>
                    <div>
                      <a
                        href={enquiryLink('Hello, I would like to ask about a consultation.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-saffron-deep)] underline underline-offset-4"
                      >
                        <MessageCircle className="size-4" aria-hidden />
                        {t('book.wa.direct')}
                      </a>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-body-warm)]">
                        {t('book.wa.directHint')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-sans text-[15px] font-semibold">{t('book.step1')}</h2>
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
                        {s.duration_minutes} min{publicPrice(s.price_paise) ? ` · ${publicPrice(s.price_paise)}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-sans text-[15px] font-semibold">{t('book.step2')}</h2>
                {/*
                  Says why the next few days are greyed out.

                  Without this the calendar looks broken rather than booked:
                  a visitor sees today and tomorrow disabled, assumes Komal is
                  full, and leaves. The date is computed rather than hardcoded
                  so it cannot drift from what the server will actually accept
                  if the lead time is changed in the admin console.
                */}
                {showsLeadNote ? (
                  <p className="mb-4 mt-1.5 text-xs leading-relaxed text-[var(--color-body-warm)]">
                    Komal prepares each chart in advance, so the earliest session is{' '}
                    <strong className="font-semibold text-[var(--color-cocoa)]">
                      {formatLongDay(`${earliestKey}T00:00:00+05:30`)}
                    </strong>
                    . Call {BRAND.phones[0]} if you need something sooner.
                  </p>
                ) : (
                  <div className="mb-4" />
                )}
                {/*
                  No slot is held in WhatsApp mode, so this has to be said where
                  the choice is made — not further down and not in small print.
                  A calendar that looks exactly like a booking calendar but
                  reserves nothing is the one genuinely misleading thing about
                  this flow, and this line is what stops it being so.
                */}
                {BOOKING_MODE === 'whatsapp' && (
                  <p className="mb-4 border-l-2 border-[var(--color-saffron)] bg-[var(--color-cream)] py-2 pl-3 text-xs leading-relaxed text-[var(--color-body-warm)]">
                    {t('book.wa.notReserved')}
                  </p>
                )}
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
                    month={month}
                    onMonthChange={setMonth}
                    minMonth={monthOfKey(earliestKey)}
                    maxMonth={monthOfKey(latestKey)}
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

              {/* No hold exists in WhatsApp mode, so there is no countdown to
                  show — and a timer would imply the slot is being held. */}
              {BOOKING_MODE === 'payment' && hold && (
                <div className="mb-6">
                  <HoldTimer expiresAt={hold.expiresAt} onExpire={onHoldExpired} />
                </div>
              )}

              {/*
                The post-click panel. It says "press send", never "sent".
                Rendered above the form rather than replacing it so the details
                stay on screen — if the message did not go, the visitor can
                re-open it without retyping everything.
              */}
              {handedOff && (
                <div className="mb-6 border border-[var(--color-saffron)] bg-[var(--color-cream)] p-5">
                  <p className="font-sans text-[15px] font-semibold text-[var(--color-cocoa)]">
                    {t('book.wa.opened.title')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-body-warm)]">
                    {t('book.wa.opened.body')}
                  </p>
                  <button
                    type="submit"
                    className="mt-3 text-sm font-medium text-[var(--color-saffron-deep)] underline underline-offset-4"
                  >
                    {t('book.wa.opened.retry')}
                  </button>
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
                <fieldset disabled={step === 'paying'} className="space-y-5">
                  <legend className="font-sans text-[15px] font-semibold">{t('book.step3')}</legend>

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
                  <p className="text-xs leading-relaxed text-[var(--color-body-warm)] mb-4">
                    No account or password needed — just pay and you are booked.
                  </p>

                  <div className="pt-2">
                    <h3 className="font-sans text-[15px] font-semibold mb-1">Birth details</h3>
                    <p className="text-xs leading-relaxed text-[var(--color-body-warm)] mb-5">
                      These details are private and visible only to Komal.
                    </p>

                    <div className="grid gap-5 sm:grid-cols-2 mb-5">
                      <Field label="Date of birth" htmlFor="b-bdate" required error={form.formState.errors.birthDate?.message}>
                        <Input {...form.register('birthDate')} type="date" />
                      </Field>
                      <Field label="Time of birth" htmlFor="b-btime" error={form.formState.errors.birthTime?.message}>
                        <Input {...form.register('birthTime')} type="time" disabled={!birthTimeKnown} />
                      </Field>
                    </div>

                    <div className="mb-5">
                      {/* "I do not know" is a first-class answer. Demanding an exact
                          birth time from someone who does not have it is a real
                          abandonment cause in this category. */}
                      <Checkbox
                        id="b-timeknown"
                        label="I am not sure of the exact birth time"
                        checked={!birthTimeKnown}
                        onChange={(e) => form.setValue('birthTimeKnown', !e.target.checked)}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field label="City of birth" htmlFor="b-bcity" required error={form.formState.errors.birthCity?.message}>
                        <Input {...form.register('birthCity')} placeholder="City" autoComplete="off" />
                      </Field>
                      <Field label="State of birth" htmlFor="b-bstate" required error={form.formState.errors.birthState?.message}>
                        <Input {...form.register('birthState')} placeholder="State" autoComplete="off" />
                      </Field>
                      <Field label="Country of birth" htmlFor="b-bcountry" required error={form.formState.errors.birthCountry?.message}>
                        <Input {...form.register('birthCountry')} placeholder="Country" autoComplete="off" />
                      </Field>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start gap-2 rounded bg-white p-4 border border-[var(--color-outline-variant)]">
                      <ShieldCheck className="size-5 text-[var(--color-saffron-deep)] shrink-0 mt-0.5" aria-hidden />
                      <p className="text-sm leading-relaxed text-[var(--color-cocoa)]">
                        <strong>100% Confidential.</strong> Everything you talk about during your consultation remains strictly confidential.
                      </p>
                    </div>
                  </div>

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

                {BOOKING_MODE === 'whatsapp' ? (
                  <>
                    <Button type="submit" size="lg" full>
                      <MessageCircle aria-hidden /> {t('book.wa.cta')}
                    </Button>

                    {/*
                      Shown BEFORE the click as well as after. Someone who has
                      just filled in a form expects pressing the button to
                      finish the job; being told beforehand that one more action
                      is required is what stops them closing the tab on a
                      message they never sent.
                    */}
                    <p className="text-center text-xs leading-relaxed text-[var(--color-body-warm)]">
                      {t('book.wa.step.send')}
                    </p>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-body-warm)]">
                      <Lock className="size-3" aria-hidden />
                      {t('book.wa.noPaymentNow')}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="submit"
                      size="lg"
                      full
                      loading={step === 'paying'}
                      loadingText="Opening secure payment…"
                    >
                      Pay {formatPaise(total)} securely
                    </Button>

                    <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-body-warm)]">
                      <Lock className="size-3" aria-hidden />
                      Payment is processed by Razorpay. Your card details never reach our servers.
                    </p>
                  </>
                )}
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
