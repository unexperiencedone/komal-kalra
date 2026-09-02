import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toE164 } from '@/lib/notifications/whatsapp';

/**
 * Meta WhatsApp webhook — delivery receipts and inbound replies.
 *
 * WHY THIS ENDPOINT EXISTS AT ALL
 *
 * The send call returns 200 when Meta ACCEPTS a message. That is not delivery.
 * A message can be accepted and then never arrive — the number has no WhatsApp
 * account, the user blocked the business, a template variable contained a
 * newline. Without this endpoint every one of those is recorded as `sent`, and
 * the first anyone hears about it is a client who missed their consultation.
 *
 * It also catches replies. On the Cloud API direct there is no inbox of any
 * kind, so a client answering "can we make it 4pm?" is received by Meta and
 * dropped on the floor unless something here writes it down.
 *
 * FOUR RULES, the same ones the Razorpay webhook follows:
 *
 *  1. VERIFY THE RAW BODY FIRST. `request.text()` is read before anything else
 *     and JSON.parse is not called until the HMAC passes. A body parser that
 *     re-encodes JSON changes the bytes and breaks the comparison — the classic
 *     way this check ends up silently disabled.
 *
 *  2. IDEMPOTENCY IS A DATABASE CONSTRAINT. Inbound messages carry a UNIQUE
 *     provider_message_id; a redelivery collides and is ignored. Meta retries
 *     on any non-2xx, so at-least-once is guaranteed, not hypothetical.
 *
 *  3. ALWAYS RETURN 200 ONCE VERIFIED. Meta retries with backoff for up to
 *     seven days and disables a webhook that keeps failing. A parse error on
 *     one status must not cost us the whole subscription.
 *
 *  4. NEVER ASSUME ORDER. `delivered` can arrive before `sent`. Status
 *     transitions here only ever move forward — see rank() below.
 *
 * `proxy.ts` must exclude this path: Meta sends no session cookie, so session
 * refresh is pure latency.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ========================================================================== */
/*  GET — the subscription handshake                                          */
/* ========================================================================== */

/**
 * Meta calls this once when you save the callback URL, and will not accept the
 * endpoint until it echoes `hub.challenge` back as PLAIN TEXT with a 200.
 *
 * Returning JSON here is the single most common reason "Verify and save" fails:
 * the response body must be the challenge value and nothing else — no quotes,
 * no wrapper object.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    console.error('[whatsapp/webhook] WHATSAPP_VERIFY_TOKEN is not set');
    return new NextResponse('not configured', { status: 503 });
  }

  // Constant-time, and length-checked first because timingSafeEqual throws on
  // a length mismatch rather than returning false.
  const ok =
    mode === 'subscribe' &&
    typeof token === 'string' &&
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  if (!ok) {
    console.warn('[whatsapp/webhook] verification failed');
    return new NextResponse('forbidden', { status: 403 });
  }

  return new NextResponse(challenge ?? '', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/* ========================================================================== */
/*  POST — events                                                             */
/* ========================================================================== */

interface MetaStatus {
  id?: string;
  status?: string;
  recipient_id?: string;
  timestamp?: string;
  errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
}

interface MetaMessage {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
}

interface MetaWebhook {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: MetaMessage[];
        statuses?: MetaStatus[];
      };
    }[];
  }[];
}

/**
 * How far along a delivery is. Higher wins.
 *
 * Meta does not guarantee ordering, and a `delivered` arriving after a `read`
 * would otherwise walk the row backwards — making a message that demonstrably
 * reached someone look less delivered than it is.
 */
function rank(status: string): number {
  switch (status) {
    case 'sent': return 1;
    case 'delivered': return 2;
    case 'read': return 3;
    case 'undelivered': return 4; // terminal
    default: return 0;
  }
}

export async function POST(request: Request) {
  // ---- 1. Raw body, before any parsing -------------------------------------
  const raw = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    // Refuse rather than accept unverified events. An endpoint that skips this
    // check accepts anything anyone posts to it — including fabricated
    // "delivered" receipts, which would mask exactly the failures it exists to
    // surface. 503 makes Meta retry, so nothing is lost once it is configured.
    console.error('[whatsapp/webhook] WHATSAPP_APP_SECRET is not set; refusing events');
    return new NextResponse('not configured', { status: 503 });
  }

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(raw, 'utf8').digest('hex');

  if (
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    console.warn('[whatsapp/webhook] signature mismatch');
    return new NextResponse('invalid signature', { status: 401 });
  }

  // ---- 2. Only now is the body trustworthy ---------------------------------
  let body: MetaWebhook;
  try {
    body = JSON.parse(raw) as MetaWebhook;
  } catch {
    // Verified but unparseable. 200 anyway — retrying will not fix malformed
    // JSON, and repeated failures get the webhook disabled.
    console.error('[whatsapp/webhook] verified payload was not JSON');
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        for (const status of value.statuses ?? []) {
          await applyStatus(admin, status);
        }

        const contactName = value.contacts?.[0]?.profile?.name ?? null;
        for (const message of value.messages ?? []) {
          await recordInbound(admin, message, contactName);
        }
      }
    }
  } catch (error) {
    // Logged, not surfaced. The events are Meta's to retry, but a bug in our
    // handling should not cost the subscription — and a 500 here retries the
    // whole batch, re-applying statuses we already handled.
    console.error('[whatsapp/webhook] handler error', error);
  }

  return NextResponse.json({ ok: true });
}

/* -------------------------------------------------------------------------- */

type Admin = ReturnType<typeof createAdminClient>;

async function applyStatus(admin: Admin, status: MetaStatus) {
  if (!status.id || !status.status) return;

  // Meta says "failed"; we store "undelivered" to keep it out of the worker's
  // retry query. Re-sending to a number with no WhatsApp account never
  // succeeds and is billed every time.
  const incoming = status.status === 'failed' ? 'undelivered' : status.status;
  if (rank(incoming) === 0) return;

  const { data: row } = await admin
    .from('notification_outbox')
    .select('id, status')
    .eq('provider_message_id', status.id)
    .maybeSingle<{ id: string; status: string }>();

  // No match: almost always the smoke-test message, or one sent before
  // provider_message_id was captured. Not an error.
  if (!row) return;

  // Forward only. Meta does not guarantee ordering, so a `delivered` can arrive
  // after a `read` and a late `sent` after both. Without this a message that
  // demonstrably reached someone can be walked back to a weaker state.
  if (rank(row.status) >= rank(incoming)) return;

  // `read` is a stronger signal than `delivered` but not a distinct state worth
  // storing — both mean it arrived.
  const nextStatus = incoming === 'undelivered' ? 'undelivered' : 'delivered';
  const error = status.errors?.[0];

  await admin
    .from('notification_outbox')
    .update({
      status: nextStatus,
      // Only stamped on the way to `delivered`. Writing null on any other
      // transition would erase a real delivery time.
      ...(nextStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
      last_error: error
        ? `${error.code ?? ''} ${error.title ?? ''} ${error.error_data?.details ?? ''}`.trim().slice(0, 500)
        : null,
    })
    .eq('id', row.id);

  if (nextStatus === 'undelivered') {
    // Loud on purpose. This is a client who did not get their booking details,
    // and the only other trace of it is a row in a table nobody watches.
    console.error(
      `[whatsapp] UNDELIVERED to ${status.recipient_id ?? 'unknown'} — ` +
      `${error?.code ?? ''} ${error?.title ?? 'no reason given'}`,
    );
  }
}

async function recordInbound(admin: Admin, message: MetaMessage, profileName: string | null) {
  if (!message.id || !message.from) return;

  // Meta gives `from` without a leading +.
  const from = toE164(`+${message.from}`) ?? message.from;

  // Best-effort link to a client by the number they booked with. A miss is
  // ordinary — people message from second phones — so this never blocks the
  // insert.
  const { data: match } = await admin
    .from('appointments')
    .select('user_id')
    .eq('contact_phone', from)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ user_id: string }>();

  const { error } = await admin.from('whatsapp_inbound').insert({
    provider_message_id: message.id,
    from_phone: from,
    profile_name: profileName,
    message_type: message.type ?? 'unknown',
    body: message.text?.body ?? null,
    raw: message as unknown as Record<string, unknown>,
    user_id: match?.user_id ?? null,
  });

  // 23505 = the same event delivered twice. That is the constraint doing its
  // job, not a failure.
  if (error && (error as { code?: string }).code !== '23505') {
    console.error('[whatsapp/webhook] could not record inbound message', error.message);
  }
}
