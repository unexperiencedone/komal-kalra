# WhatsApp booking notifications — setup

Booking details go to **two** people on WhatsApp: the client, and Komal.

Right now nothing sends. The code is written and wired; the messages queue in
`notification_outbox` on the `whatsapp` channel and stay there, logged, marked
`queued` — never marked sent. Fill in the environment variables below and the
backlog delivers itself on the next cron run. **Email is unaffected throughout**,
so a client always gets a confirmation even before any of this is done.

---

## 1. The one thing that shapes everything

**You cannot send arbitrary text to a WhatsApp user.**

A message the business starts — which every booking confirmation is, because the
client has not written to us — must use a **template approved by Meta in
advance**. The API sends a template *name* plus an ordered list of values that
fill its `{{1}}`, `{{2}}` placeholders. Free text is possible only inside a
24-hour window that opens when the customer messages first.

This is why `renderWhatsApp()` in `src/lib/notifications/whatsapp.ts` returns a
template name and positional variables rather than a message body. **The order
of the variables in that file and the order of the placeholders in the template
you register below must match.** A mismatch does not crash — it sends a client a
message reading "confirmed for ₹2,600" where the date should be.

---

## 2. Choose a route

| | Meta Cloud API direct | BSP (Interakt, AiSensy, Wati) |
|---|---|---|
| Platform fee | none | ~₹1,200–3,500/month |
| Per message | ~₹0.145 utility | same, sometimes marked up — Interakt notably does not mark up |
| Setup | you build webhooks, template management, retries | done for you |
| Komal's inbox | none — she cannot reply from an app | included, replies from a phone |
| Already built here | ✅ `MetaCloudProvider` | second `WhatsAppProvider` implementation, ~30 lines |

**Komal's inbox is the deciding factor, not the price.** Direct Cloud API gives
her no way to see or answer a client who replies to a confirmation, and clients
will reply. At this volume the platform fee is smaller than the cost of missing
those.

Whichever you pick, nothing outside `src/lib/notifications/whatsapp.ts` changes.

---

## 3. Templates to register

In **WhatsApp Manager → Account tools → Message templates → Create**.

Category **Utility** for all three — not Marketing. Utility is roughly a seventh
of the price, and these are transactional messages about a purchase, which is
what Utility is for. Submitting them as Marketing costs ~7× per message *and*
they can be blocked by a user's marketing opt-out.

### `booking_confirmed_client` — Utility, English

```
Namaste {{1}}, your consultation with Astrologer Komal Kalra is confirmed.

Service: {{2}}
When: {{3}}
Reference: {{4}}
Paid: {{5}}

View your booking: {{6}}

Komal will send the joining link before your session.
```

| # | Value | Sample for approval |
|---|---|---|
| 1 | Client name | `Simran` |
| 2 | Service | `Astrological Guidance` |
| 3 | Date and time | `Thursday, 4 September 2026 at 11:00 am IST` |
| 4 | Reference | `KK-100248` |
| 5 | Amount paid | `₹2,600` |
| 6 | Booking link | `https://your-domain.com/book/confirm?appointment=…&t=…` |

### `booking_alert_admin` — Utility, English

Komal's copy. **Deliberately a different template**, because it carries the
client's phone number and what they want to discuss — which the client's own
message obviously must not — and because it addresses her, not them.

```
New booking.

Client: {{1}}
Service: {{2}}
When: {{3}}
Reference: {{4}}
Phone: {{5}}
Wants to discuss: {{6}}
```

> **`{{6}}` currently always renders `—`.** The booking form's "What would you
> like to discuss?" field was removed in a later refactor, so
> `appointments.client_question` is never populated and nothing fills this
> placeholder. Either put that field back on the form, or register this template
> with five variables and drop the last line — because changing an approved
> template means submitting it for approval again. Worth deciding *before* you
> register it, not after.

### `appointment_reminder` — Utility, English

The client's reminder, 24 hours before.

```
Namaste {{1}}, a reminder that your {{2}} with Astrologer Komal Kalra is {{3}}.

Details: {{4}}
```

### `appointment_reminder_admin` — Utility, English

Komal's reminder, same 24 hours. Separate from the client's for a reason beyond
tone: the client's version links to *their* booking page, so sending Komal the
same message would give her a reminder about her own day written as though she
were the client, pointing at one client's booking.

```
Reminder: {{1}} with {{2}} is {{3}}.
Their number: {{4}}
```

| # | Value | Sample |
|---|---|---|
| 1 | Service | `Astrological Guidance` |
| 2 | Client name | `Simran` |
| 3 | Date and time | `Thursday, 4 September 2026 at 11:00 am IST` |
| 4 | Client's phone | `+919812345678` |

**Approval takes minutes to a few hours.** A rejection is almost always the
category (Marketing vs Utility) or a variable at the very start or end of the
message body, which Meta rejects. None of the three above start or end with one.

---

## 3a. Going to production

The values currently in `.env` are **test credentials**. Two things about them
will stop working, and both fail in ways that look like a bug rather than a
configuration expiry:

- **The test access token expires in 24 hours.** Confirmations send perfectly
  all day and then stop. Nobody notices until a client says they got nothing.
- **The test number only sends to up to 5 pre-registered recipients.** Any real
  client booking is silently not delivered.

So the test setup is fine for proving the wiring works and is not a soft launch.

### The checklist, in dependency order

| # | Step | Where | Blocks |
|---|---|---|---|
| 1 | **Business verification** | Business Settings → Security Centre | everything below |
| 2 | Add a **real phone number** to the WABA | WhatsApp Manager → Phone numbers | step 3 |
| 3 | **Display name** approval for that number | same screen | sending |
| 4 | Add a **payment method** to the WABA | WhatsApp Manager → Billing | sending past the free tier |
| 5 | **Permanent System User token** | Business Settings → System Users | tokens expiring daily |
| 6 | App to **Live mode** | App Dashboard, toggle top of page | webhook events |
| 7 | **Webhook** configured and subscribed | §4a below | receipts and replies |
| 8 | Templates submitted and approved | §3 above | sending anything |

**Business verification is the long pole — budget 2–4 days.** Everything
technical takes hours once it clears. Median end-to-end is 3–5 business days, so
do not schedule the go-live announcement against the technical work.

**Step 5 in detail, because this is the one people get wrong.** The token on the
API Setup page is temporary no matter how production-ready everything else is.
Business Settings → System Users → Add → give it Admin on the app and the WABA →
Generate token → select the WhatsApp Business Account → scopes
`whatsapp_business_messaging` and `whatsapp_business_management` → **set expiry
to Never**. That is the value for `WHATSAPP_ACCESS_TOKEN`.

**Messaging limits.** A newly verified number starts at **1,000 business-initiated
conversations per rolling 24 hours** and tiers up automatically on quality and
volume. That is far above this practice's booking rate, so it will not bite —
but a low **quality rating** can drop the tier or pause the number. Quality is
driven by users blocking and reporting, which is exactly why the confirmations
are Utility templates sent only to people who just paid, and why nothing here
sends marketing.

---

## 4. Environment variables

```
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_NUMBER_ID=       # WhatsApp Manager → API Setup
WHATSAPP_ACCESS_TOKEN=          # a PERMANENT system-user token, not the 24h test one
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_ADMIN_TO=+919812345678 # Komal's WhatsApp, E.164
```

Two of these are worth pausing on.

**`WHATSAPP_ACCESS_TOKEN` must be a System User token.** The token shown on the
API Setup page expires in 24 hours. Confirmations will send perfectly for one
day and then stop, which is a failure nobody notices until a client complains.
Business Settings → System Users → Add → assign the WhatsApp Business Account →
Generate token, no expiry.

**`WHATSAPP_ADMIN_TO` has no safe default.** If it is unset the practitioner
alert is *skipped* and a warning is logged, rather than being sent to
`BRAND.phones[0]`. That message contains a client's name, number and personal
question; delivering it to whatever number happens to be published — a landline,
an old number, a shared office phone — would be a data breach that looks exactly
like the feature working.

---

## 4a. Webhooks

**Endpoint:** `https://your-domain.com/api/whatsapp/webhook`

It must be **HTTPS on a public domain with a valid certificate**. Meta will not
accept `localhost`, an IP address, or a self-signed cert. For local development
use a tunnel (`cloudflared tunnel --url http://localhost:3000`) and paste the
tunnel URL — but remember the URL changes each restart and has to be re-saved.

### Why bother

Sending returns `200` when Meta **accepts** a message. That is not delivery. A
message can be accepted and then never arrive — the number has no WhatsApp
account, the person blocked the business, a template variable contained a
newline. Without the webhook every one of those is recorded as `sent`, and the
first anyone hears is a client who missed their consultation.

It is also the only way replies reach you at all. On the Cloud API direct there
is no inbox; a client answering *"can we make it 4pm?"* is dropped unless this
endpoint writes it down.

### Configure it

1. App Dashboard → **WhatsApp → Configuration → Webhook → Edit**.
2. **Callback URL**: the endpoint above.
3. **Verify token**: any string you invent. Put the same value in
   `WHATSAPP_VERIFY_TOKEN`. Generate one with `openssl rand -hex 24`.
4. Click **Verify and save**. Meta immediately `GET`s the URL and expects
   `hub.challenge` echoed back as **plain text**. The route does this.
5. **Manage → subscribe to the `messages` field.** This single field carries
   both inbound messages and delivery statuses, despite the name.
6. App Settings → Basic → **App Secret** → copy into `WHATSAPP_APP_SECRET`.

**Step 5 is the step that gets skipped.** Saving the callback URL is not
subscribing. The dashboard's "Test" button fires sample events and everything
looks correct, while real traffic produces nothing — because the WABA itself was
never subscribed to the app. If receipts never arrive, check this first.

### What the endpoint does with events

| Meta status | Stored as | Effect |
|---|---|---|
| `sent` | `sent` | already set at send time |
| `delivered` / `read` | `delivered` | `delivered_at` stamped |
| `failed` | `undelivered` | terminal, logged as an error, **not retried** |

`failed` becomes `undelivered` rather than `failed` deliberately: the worker
retries `failed` rows, and re-sending to a number with no WhatsApp account never
succeeds while being billed every time.

Matching a receipt to a booking depends on the `wamid` captured at send time in
`notification_outbox.provider_message_id`. Messages sent before that column
existed, and any smoke-test sends, simply will not match — that is expected and
not logged as an error.

Inbound replies land in `public.whatsapp_inbound`, linked to a client where the
sender's number matches one used at booking. **There is no UI for this yet.** It
guarantees nothing is lost; it does not let Komal reply. That still needs either
a BSP inbox or the WhatsApp Business app on the number.

### Security

Every event is authenticated with `X-Hub-Signature-256` — an HMAC-SHA256 of the
**raw** body keyed with the App Secret. The route reads `request.text()` and
verifies before `JSON.parse`, because any middleware that parses and re-encodes
JSON changes the bytes and breaks the comparison. That is the usual way this
check ends up quietly disabled.

If `WHATSAPP_APP_SECRET` is unset the route returns **503 and processes
nothing**, rather than trusting unverified events. An open webhook accepts
forged `delivered` receipts from anyone who finds the URL, which would hide the
exact failures it was added to surface. 503 makes Meta retry, so nothing is lost
once the secret is set.

`src/proxy.ts` excludes this path so the raw body reaches the route untouched
and the GET handshake is not wrapped or redirected.

---

## 5. Test before trusting it

`MetaCloudProvider` is written from Meta's documented request shape and **has not
been run against a live account**, because there were no credentials to test
with. Send one message to your own number first:

```bash
curl -X POST "https://graph.facebook.com/v21.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "+919812345678",
    "type": "template",
    "template": {
      "name": "booking_confirmed_client",
      "language": { "code": "en" },
      "components": [{
        "type": "body",
        "parameters": [
          {"type":"text","text":"Simran"},
          {"type":"text","text":"Astrological Guidance"},
          {"type":"text","text":"Thursday, 4 September 2026 at 11:00 am IST"},
          {"type":"text","text":"KK-100248"},
          {"type":"text","text":"Rs 2,600"},
          {"type":"text","text":"https://example.com/b/1"}
        ]
      }]
    }
  }'
```

A `200` with a `messages[0].id` means the request was accepted. **Accepted is not
delivered** — check the phone. The common silent failure is a variable containing
a newline, a tab, or four or more consecutive spaces; the API takes it and
delivery fails. `param()` in `whatsapp.ts` flattens whitespace for exactly this
reason, and the client's free-text question is the field most likely to trip it.

Then end to end: make a ₹1 booking through `guidance-verification`
(`docs/payment-verification.md`), and confirm **two** messages arrive — one to
the client number, one to Komal.

---

## 6. What is queued, and when

On a confirmed payment, `settlePayment()` queues five rows:

| Template | Channel | To | When |
|---|---|---|---|
| `booking_confirmed` | email | client | immediately |
| `booking_confirmed` | whatsapp | client | immediately |
| `booking_alert_admin` | whatsapp | Komal | immediately |
| `appointment_reminder` | email + whatsapp | client | 24 h before |
| `appointment_reminder_admin` | whatsapp | Komal | 24 h before |

Each is a **separate row with its own dedupe key**, so the channels succeed and
fail independently: a rejected WhatsApp template must not mark the email failed,
and a bounced email must not stop the WhatsApp message.

Refunds, payment failures and cancellations stay on **email only**. They are the
messages someone may need to forward to a bank or quote months later, they read
badly squeezed into six placeholders, and there is no reason to pay per message
and wait on template approval for something email already does better.

---

## 7. Watching it

```sql
select channel, status, template, count(*), max(last_error)
  from public.notification_outbox
 group by channel, status, template
 order by channel, status;
```

- `status = 'queued'` with `attempts = 0` on the whatsapp channel → not
  configured yet. Expected before step 4.
- `status = 'failed'` with `last_error` mentioning *template name does not
  exist* → the template is not approved, or `WHATSAPP_TEMPLATE_LANG` does not
  match the language it was approved in.
- `last_error` starting `unusable_number_` → `toE164()` could not parse what the
  client typed. It assumes India for a bare 10-digit number and returns nothing
  rather than guessing for anything else. The email still went.
- `status = 'sent'` that never becomes `delivered` → the webhook is not
  configured, or the WABA is not subscribed to the `messages` field (§4a).
- `status = 'undelivered'` → the message genuinely did not arrive. `last_error`
  has Meta's reason. **These are worth watching**; nothing else in the system
  will tell you a client missed their confirmation.

```sql
-- Bookings whose WhatsApp confirmation did not arrive.
select o.recipient, o.template, o.last_error, o.created_at
  from public.notification_outbox o
 where o.channel = 'whatsapp' and o.status = 'undelivered'
 order by o.created_at desc;

-- Replies nobody has dealt with.
select from_phone, profile_name, body, received_at
  from public.whatsapp_inbound
 where handled = false
 order by received_at desc;
```

The cron route returns both channels' summaries separately, so one glance says
which side is stuck:

```json
{ "email": { "sent": 3 }, "whatsapp": { "skipped": 3 } }
```
