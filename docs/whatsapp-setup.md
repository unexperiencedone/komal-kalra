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

### `appointment_reminder` — Utility, English

```
Namaste {{1}}, a reminder that your {{2}} with Astrologer Komal Kalra is {{3}}.

Details: {{4}}
```

**Approval takes minutes to a few hours.** A rejection is almost always the
category (Marketing vs Utility) or a variable at the very start or end of the
message body, which Meta rejects. None of the three above start or end with one.

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

On a confirmed payment, `settlePayment()` queues four rows:

| Template | Channel | When |
|---|---|---|
| `booking_confirmed` | email | immediately |
| `booking_confirmed` | whatsapp | immediately |
| `booking_alert_admin` | whatsapp | immediately, to Komal |
| `appointment_reminder` | email + whatsapp | 24 h before the session |

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

The cron route returns both channels' summaries separately, so one glance says
which side is stuck:

```json
{ "email": { "sent": 3 }, "whatsapp": { "skipped": 3 } }
```
