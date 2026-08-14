-- ============================================================================
-- 17_functions_payments.sql — the payment state machine
--
-- Every transition of money-state in the system goes through these functions.
-- They are idempotent by construction, which is what allows the verify endpoint
-- and the webhook to race each other safely (research §4.2).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Legal transition table. Anything not listed is rejected.
-- ---------------------------------------------------------------------------
create or replace function public.payment_transition_allowed(
  p_from payment_status,
  p_to   payment_status
)
returns boolean
language sql
immutable
as $$
  select case
    when p_from = p_to then true                                    -- replay: no-op
    when p_from = 'created'    and p_to in ('pending','cancelled','failed') then true
    when p_from = 'pending'    and p_to in ('processing','paid','failed','cancelled') then true
    when p_from = 'processing' and p_to in ('paid','failed') then true
    when p_from = 'paid'       and p_to in ('refunded','partially_refunded') then true
    when p_from = 'partially_refunded' and p_to in ('refunded','partially_refunded') then true
    else false
  end;
$$;

comment on function public.payment_transition_allowed(payment_status, payment_status) is
  'Webhook events can arrive out of order (research §4.3.4). Illegal transitions are rejected rather than assumed impossible.';

-- ---------------------------------------------------------------------------
-- confirm_appointment_payment
--
-- Called by BOTH /api/payments/verify and /api/payments/webhook. Whichever
-- arrives first performs the transition; the second gets `already_confirmed`
-- and fires no side effects.
--
-- The idempotency guarantee is the conditional UPDATE: the WHERE clause pins
-- the expected predecessor state, so a replay updates zero rows.
--
-- Returns a discriminated result rather than raising, because the caller must
-- distinguish "duplicate, fine" from "slot conflict, refund needed".
-- ---------------------------------------------------------------------------
create or replace function public.confirm_appointment_payment(
  p_payment_id          uuid,
  p_provider_payment_id text,
  p_amount_paise        bigint,
  p_method              text default null,
  p_signature           text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_appt    public.appointments%rowtype;
  v_updated integer;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('result','not_found');
  end if;

  -- Replay: already settled. Return success WITHOUT re-firing side effects.
  if v_payment.status in ('paid','partially_refunded','refunded') then
    return jsonb_build_object(
      'result','already_confirmed',
      'payment_id', v_payment.id,
      'appointment_id', v_payment.appointment_id
    );
  end if;

  if not public.payment_transition_allowed(v_payment.status, 'paid') then
    return jsonb_build_object(
      'result','illegal_transition',
      'from', v_payment.status,
      'to', 'paid'
    );
  end if;

  -- The amount is checked against what WE recorded when creating the order.
  -- A mismatch means the provider captured a different sum than we asked for,
  -- which must never be silently accepted.
  if p_amount_paise is not null and p_amount_paise <> v_payment.amount_paise then
    return jsonb_build_object(
      'result','amount_mismatch',
      'expected', v_payment.amount_paise,
      'received', p_amount_paise
    );
  end if;

  update public.payments
     set status              = 'paid',
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
         provider_signature  = coalesce(p_signature, provider_signature),
         method              = coalesce(p_method, method),
         verified_at         = coalesce(verified_at, now()),
         paid_at             = coalesce(paid_at, now()),
         receipt_number      = coalesce(receipt_number,
                                        'RCPT-' || to_char(now(), 'YYYYMM') || '-' ||
                                        upper(substring(replace(id::text,'-','') for 8)))
   where id = p_payment_id
     and status in ('created','pending','processing');

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    -- Lost a race with a concurrent confirmation. Treat as duplicate.
    return jsonb_build_object('result','already_confirmed','payment_id', p_payment_id);
  end if;

  -- Now confirm the appointment. Same conditional-update discipline.
  select * into v_appt from public.appointments
   where id = v_payment.appointment_id for update;

  if not found then
    return jsonb_build_object('result','appointment_missing','payment_id', p_payment_id);
  end if;

  begin
    update public.appointments
       set status = 'confirmed',
           payment_status = 'paid'
     where id = v_appt.id
       and status = 'pending_payment';

    get diagnostics v_updated = row_count;
  exception
    -- The slot was taken between order creation and capture. Money is real and
    -- must be accounted for: the payment stays `paid`, the appointment moves to
    -- needs_attention, and the admin dashboard surfaces it for refund.
    -- We never silently keep money for a booking that does not exist.
    when exclusion_violation then
      update public.appointments
         set status = 'needs_attention', payment_status = 'paid'
       where id = v_appt.id;

      insert into public.notifications (user_id, title, message, action_url, category)
      select p.id,
             'Booking needs attention',
             'A payment was received but the selected time could not be secured. Komal''s team will contact you shortly.',
             '/dashboard/appointments/' || v_appt.id,
             'booking'
        from public.profiles p where p.id = v_appt.user_id;

      return jsonb_build_object(
        'result','slot_conflict',
        'payment_id', p_payment_id,
        'appointment_id', v_appt.id
      );
  end;

  if v_updated = 0 then
    -- Appointment already left pending_payment (concurrent confirm, or admin
    -- cancelled it). Sync the payment_status but do not resurrect the booking.
    update public.appointments
       set payment_status = 'paid'
     where id = v_appt.id and payment_status <> 'paid';

    return jsonb_build_object(
      'result','already_confirmed',
      'payment_id', p_payment_id,
      'appointment_id', v_appt.id
    );
  end if;

  -- Release the hold: the appointment row itself now protects the slot.
  update public.slot_holds
     set released_at = coalesce(released_at, now())
   where id = v_appt.hold_id;

  insert into public.notifications (user_id, title, message, action_url, category)
  values (
    v_appt.user_id,
    'Your consultation is confirmed',
    v_appt.service_title_snapshot || ' on ' ||
      to_char(v_appt.starts_at at time zone public.business_timezone(), 'DD Mon YYYY at HH12:MI AM'),
    '/dashboard/appointments/' || v_appt.id,
    'booking'
  );

  return jsonb_build_object(
    'result','confirmed',
    'payment_id', p_payment_id,
    'appointment_id', v_appt.id,
    'reference', v_appt.reference
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- fail_appointment_payment — payment.failed, or a user-cancelled checkout
--
-- Frees the slot immediately so the calendar is not held hostage by a failed
-- card, but keeps the appointment row (status cancelled) as a recoverable lead.
-- ---------------------------------------------------------------------------
create or replace function public.fail_appointment_payment(
  p_payment_id  uuid,
  p_error_code  text default null,
  p_error_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_updated integer;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('result','not_found');
  end if;

  -- A failure event arriving AFTER a successful capture (retried card) must
  -- never un-confirm a paid booking.
  if v_payment.status in ('paid','partially_refunded','refunded') then
    return jsonb_build_object('result','ignored_already_paid');
  end if;

  update public.payments
     set status = 'failed',
         failed_at = coalesce(failed_at, now()),
         error_code = coalesce(p_error_code, error_code),
         error_description = coalesce(p_error_description, error_description)
   where id = p_payment_id
     and status in ('created','pending','processing');

  get diagnostics v_updated = row_count;

  update public.appointments
     set payment_status = 'failed',
         status = 'cancelled',
         cancelled_at = coalesce(cancelled_at, now()),
         cancellation_reason = coalesce(cancellation_reason, 'Payment was not completed')
   where id = v_payment.appointment_id
     and status = 'pending_payment';

  update public.slot_holds
     set released_at = coalesce(released_at, now())
   where converted_appointment_id = v_payment.appointment_id;

  return jsonb_build_object('result', case when v_updated > 0 then 'failed' else 'noop' end);
end;
$$;

-- ---------------------------------------------------------------------------
-- record_refund
--
-- Called after the provider confirms a refund. Recomputes the payment's refund
-- state from the refunds ledger rather than incrementing a counter, so a
-- duplicate webhook cannot inflate the refunded total.
-- ---------------------------------------------------------------------------
create or replace function public.record_refund(
  p_payment_id  uuid,
  p_provider_refund_id text,
  p_amount_paise bigint,
  p_status      text default 'processed',
  p_reason      text default null,
  p_initiated_by uuid default null,
  p_provider_response jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_total_refunded bigint;
  v_new_status payment_status;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('result','not_found');
  end if;

  if v_payment.status not in ('paid','partially_refunded') then
    return jsonb_build_object('result','not_refundable','status', v_payment.status);
  end if;

  insert into public.refunds (
    payment_id, provider_refund_id, amount_paise, currency,
    status, reason, initiated_by, provider_response,
    idempotency_key
  ) values (
    p_payment_id, p_provider_refund_id, p_amount_paise, v_payment.currency,
    p_status, p_reason, p_initiated_by, p_provider_response,
    coalesce(p_provider_refund_id, p_payment_id::text || ':' || p_amount_paise::text)
  )
  on conflict (idempotency_key) do update
    set status = excluded.status,
        provider_response = excluded.provider_response;

  -- Recompute from the ledger. Idempotent under duplicate delivery.
  select coalesce(sum(amount_paise), 0) into v_total_refunded
    from public.refunds
   where payment_id = p_payment_id and status = 'processed';

  if v_total_refunded >= v_payment.amount_paise then
    v_new_status := 'refunded';
    v_total_refunded := v_payment.amount_paise;
  elsif v_total_refunded > 0 then
    v_new_status := 'partially_refunded';
  else
    v_new_status := v_payment.status;
  end if;

  update public.payments
     set amount_refunded_paise = v_total_refunded,
         status = v_new_status,
         refunded_at = case when v_new_status = 'refunded'
                            then coalesce(refunded_at, now()) else refunded_at end
   where id = p_payment_id;

  update public.appointments
     set payment_status = v_new_status
   where id = v_payment.appointment_id;

  insert into public.notifications (user_id, title, message, action_url, category)
  values (
    v_payment.user_id,
    case when v_new_status = 'refunded' then 'Refund issued' else 'Partial refund issued' end,
    'A refund has been processed to your original payment method. It typically settles in 5–7 working days.',
    '/dashboard/payments',
    'payment'
  );

  return jsonb_build_object(
    'result','recorded',
    'status', v_new_status,
    'refunded_paise', v_total_refunded
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Financial reporting. Kept in SQL so the admin dashboard does not pull every
-- payment row into Node just to sum it.
-- ---------------------------------------------------------------------------
create or replace function public.revenue_summary(
  p_from timestamptz,
  p_to   timestamptz
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'gross_paise',      coalesce(sum(amount_paise) filter (where status in ('paid','partially_refunded','refunded')), 0),
    'refunded_paise',   coalesce(sum(amount_refunded_paise), 0),
    'net_paise',        coalesce(sum(amount_paise - amount_refunded_paise) filter (where status in ('paid','partially_refunded')), 0),
    'paid_count',       count(*) filter (where status in ('paid','partially_refunded','refunded')),
    'failed_count',     count(*) filter (where status = 'failed'),
    'refund_count',     count(*) filter (where status in ('refunded','partially_refunded')),
    'attempt_count',    count(*),
    'avg_order_paise',  coalesce(round(avg(amount_paise) filter (where status in ('paid','partially_refunded','refunded')))::bigint, 0),
    'conversion_rate',  case when count(*) = 0 then 0
                             else round(
                               100.0 * count(*) filter (where status in ('paid','partially_refunded','refunded'))
                               / count(*), 1)
                        end
  )
  from public.payments
  where created_at >= p_from and created_at < p_to;
$$;

create or replace function public.revenue_by_service(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (service_title text, bookings bigint, net_paise bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.service_title_snapshot,
         count(*)::bigint,
         coalesce(sum(p.amount_paise - p.amount_refunded_paise), 0)::bigint
    from public.payments p
    join public.appointments a on a.id = p.appointment_id
   where p.status in ('paid','partially_refunded')
     and p.paid_at >= p_from and p.paid_at < p_to
   group by a.service_title_snapshot
   order by 3 desc;
$$;

-- Daily net revenue for the admin chart.
create or replace function public.revenue_timeseries(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (day date, net_paise bigint, bookings bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d::date,
         coalesce(sum(p.amount_paise - p.amount_refunded_paise), 0)::bigint,
         count(p.id)::bigint
    from generate_series(p_from, p_to - interval '1 day', interval '1 day') d
    left join public.payments p
      on p.status in ('paid','partially_refunded')
     and p.paid_at >= d and p.paid_at < d + interval '1 day'
   group by d
   order by d;
$$;

-- ---------------------------------------------------------------------------
-- Grants: none of this is client-callable. Financial functions run only with
-- the service-role key from server components and admin route handlers.
-- ---------------------------------------------------------------------------
revoke all on function public.confirm_appointment_payment(uuid, text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.fail_appointment_payment(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_refund(uuid, text, bigint, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.revenue_summary(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.revenue_by_service(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.revenue_timeseries(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.prune_payment_event_payloads(interval) from public, anon, authenticated;
