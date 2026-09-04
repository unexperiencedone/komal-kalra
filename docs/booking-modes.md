# Booking modes

The site can complete a booking two ways. One environment variable chooses:

```
NEXT_PUBLIC_BOOKING_MODE=whatsapp   # currently live
NEXT_PUBLIC_BOOKING_MODE=payment    # when the Razorpay keys arrive
```

Nothing was deleted to make WhatsApp mode work. The checkout, the slot holds,
the order and verify routes, the payments tables — all still there, all still
tested, just not reached. Turning payments on is this one variable plus real
Razorpay keys.

---

## `whatsapp` — what actually happens

1. Visitor picks a service and a time, fills in their details.
2. Pressing the button opens WhatsApp with the booking details already typed.
3. **They press send.** Nothing has happened until they do.
4. Komal replies to confirm the time and arrange payment.

**No API, no approval, no credentials.** `wa.me/<number>?text=<encoded>` is a
plain deep link. This is the whole reason the mode exists — it works today
while the Business API and Razorpay paperwork are outstanding.

### It writes nothing to the database

No lead, no slot hold, no appointment, no payment row. Three consequences, and
they are not incidental:

**No slot is reserved.** Two people can request the same time and neither has
it. Every label in this mode therefore says *requested*, never *booked* or
*reserved*, and there is a line directly above the calendar saying so. The
calendar still reflects Komal's real working hours and any days she blocks in
admin, so the times shown are genuinely possible — they are just not held.

**Komal must block booked time herself**, in Admin → Availability, because no
appointment rows are created to do it for her. If she does not, the calendar
will keep offering times she has already given away.

**Birth details never reach our database.** They go from the form into a
WhatsApp message and nowhere else. That is the cleanest possible position under
the DPDP Act for that category of personal data, and worth keeping in mind
before anyone "improves" this by logging enquiries.

### Opening WhatsApp is not sending

The deep link fills the compose box and stops. Nothing on our side can observe
whether the visitor pressed send — there is no callback and no receipt.

So the flow never claims a message was sent. It says *"press send in
WhatsApp"* before the click and again after, and the details stay on screen so
a failed hand-off can be retried without retyping. A confirmation screen here
would mislead exactly the person it was meant to reassure: they would stop
waiting for a reply to a message that was never sent.

### What is switched off

- `/api/bookings/hold` is not called
- `/api/payments/order` and `/verify` are not called
- the hold countdown does not render
- no confirmation email or WhatsApp notification is queued — there is no
  appointment for the outbox to reference

The dashboard, admin console and review form all still work for appointments
Komal enters manually.

---

## Switching to `payment`

1. Put real `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   in the environment.
2. Set `NEXT_PUBLIC_BOOKING_MODE=payment`.
3. Redeploy.
4. Test with the ₹1 `guidance-verification` service — see
   `docs/payment-verification.md`.

The server is defensive about this independently: `/api/payments/order` refuses
with `payments_unconfigured` when Razorpay keys are missing, whatever the
browser believes the mode is. Setting the flag without the keys produces an
honest error, not a broken checkout.

**Check before flipping:** `POLICY.cancellationSummary` in `src/lib/config.ts`
says bookings are final and non-refundable. That was written for prepaid
bookings. While no money is taken on the site it is describing something that
does not happen, and the legal pages say the same. Worth a read either way —
they should match how the practice actually takes money.

---

## Language

`src/lib/i18n/dictionary.ts` holds the English and Punjabi strings for the
booking flow and the main navigation, side by side in one file.

**The Gurmukhi has not been reviewed by a native speaker.** It needs Komal's eye
before go-live, particularly the register and the astrological vocabulary. The
file is laid out so she can read it without reading any code.

Scope is deliberately these two surfaces. The legal documents are **not**
translated and should not be machine-translated — a mistranslated refund or
privacy clause is a liability, and those need a human translator.

If the marketing pages are translated later, that is the point to move to
`next-intl` with locale-prefixed routes (`/pa/services`) so each language gets
an indexable URL. `LanguageProvider` is deliberately small so that swap is
cheap; it stores the choice in `localStorage` and reads it after mount, which
is why the first paint is always English.
