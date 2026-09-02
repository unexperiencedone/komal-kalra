import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from './razorpay';
import { env } from '@/lib/env';
import { taxOn } from '@/lib/money';
import type { Appointment, Payment, Service } from '@/types/database';
import type { BookingDetailsInput } from '@/lib/validation/schemas';

/**
 * Booking + order creation.
 *
 * The critical property of this module: THE CLIENT NEVER SENDS AN AMOUNT.
 * It sends a service id and a hold id. The price is read from the database,
 * the discount is computed from a coupon code server-side, and the order is
 * created for whatever that arithmetic produces. There is no request shape
 * that lets a user pay ₹1 for a ₹2,600 consultation.
 */

export interface CreateOrderResult {
  appointment: Appointment;
  payment: Payment;
  providerOrderId: string;
  publicKey: string;
  amountPaise: number;
  currency: string;
}

export async function createBookingOrder(params: {
  userId: string;
  serviceId: string;
  holdId: string;
  sessionKey: string;
  details: BookingDetailsInput;
}): Promise<CreateOrderResult> {
  const admin = createAdminClient();
  const e = env();
  const provider = getPaymentProvider();

  const { data: service, error: serviceError } = await admin
    .from('services')
    .select('*')
    .eq('id', params.serviceId)
    .eq('active', true)
    .single<Service>();

  if (serviceError || !service) {
    throw Object.assign(new Error('Service not found'), { code: 'P0002' });
  }

  /**
   * Idempotency key derived from (user, hold). A user who double-clicks "Pay"
   * or whose network retries the POST gets the SAME payment row and the same
   * provider order, rather than two orders and a possible double charge.
   */
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${params.userId}:${params.holdId}`)
    .digest('hex')
    .slice(0, 48);

  // Fast path: this exact booking attempt already has a live order.
  const { data: existing } = await admin
    .from('payments')
    .select('*, appointments(*)')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing && ['created', 'pending', 'processing'].includes(existing.status)) {
    const { appointments, ...payment } = existing as Payment & { appointments: Appointment };
    return {
      appointment: appointments,
      payment: payment as Payment,
      providerOrderId: payment.provider_order_id!,
      publicKey: provider.publicKey(),
      amountPaise: payment.amount_paise,
      currency: payment.currency,
    };
  }

  // Create the appointment via the privileged RPC. This validates the hold,
  // computes price/discount/tax from the database, and is protected by the
  // EXCLUDE constraint against a concurrent booking of the same slot.
  const { data: appointment, error: apptError } = await admin
    .rpc('create_pending_appointment', {
      p_user_id: params.userId,
      p_service_id: params.serviceId,
      p_hold_id: params.holdId,
      p_session_key: params.sessionKey,
      p_client_question: null,
      p_subject_name: params.details.fullName,
      p_subject_birth_date: params.details.birthDate || null,
      p_subject_birth_time: params.details.birthTimeKnown ? params.details.birthTime || null : null,
      p_subject_birth_place: [params.details.birthCity, params.details.birthState, params.details.birthCountry].filter(Boolean).join(', ') || null,
      p_subject_birth_time_known: params.details.birthTimeKnown,
      p_coupon_code: null,
      p_tax_bps: e.TAX_BPS,
    })
    .single<Appointment>();

  if (apptError || !appointment) {
    throw apptError ?? new Error('Could not create the appointment');
  }

  // Belt and braces: recompute the total and refuse to proceed on a mismatch.
  // If this ever fires, something is wrong with the pricing path and the right
  // outcome is a failed booking, not a charge for an unverified amount.
  const expectedTotal =
    appointment.price_paise - appointment.discount_paise + taxOn(
      appointment.price_paise - appointment.discount_paise, e.TAX_BPS,
    );
  if (appointment.total_paise !== expectedTotal) {
    throw new Error(
      `Price integrity check failed for appointment ${appointment.id}: ` +
      `stored ${appointment.total_paise}, recomputed ${expectedTotal}`,
    );
  }

  const order = await provider.createOrder({
    amountMinor: appointment.total_paise,
    currency: appointment.currency,
    receipt: appointment.reference,
    idempotencyKey,
    notes: {
      appointment_id: appointment.id,
      reference: appointment.reference,
      service: appointment.service_title_snapshot,
    },
  });

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      appointment_id: appointment.id,
      user_id: params.userId,
      provider: 'razorpay',
      provider_order_id: order.id,
      amount_paise: appointment.total_paise,
      currency: appointment.currency,
      status: 'pending',
      idempotency_key: idempotencyKey,
    })
    .select('*')
    .single<Payment>();

  if (paymentError || !payment) {
    throw paymentError ?? new Error('Could not record the payment');
  }

  // Contact details are written with payment_status in ONE statement, not two.
  //
  // They are snapshotted onto the appointment rather than read back off the
  // profile at send time because the profile is mutable and shared across
  // bookings — see database/29_booking_contact.sql. This is the number the
  // WhatsApp confirmation goes to, so it has to be the one typed for THIS
  // booking.
  await admin
    .from('appointments')
    .update({
      payment_status: 'pending',
      contact_email: params.details.email.trim().toLowerCase(),
      contact_phone: params.details.phone.trim(),
    })
    .eq('id', appointment.id);

  // The in-memory row predates that update, so reflect it rather than returning
  // an object that disagrees with the database.
  appointment.contact_email = params.details.email.trim().toLowerCase();
  appointment.contact_phone = params.details.phone.trim();

  // Attach contact details to the hold so an abandoned checkout still produces
  // a usable lead (research §3.4).
  await admin
    .from('slot_holds')
    .update({
      guest_name: params.details.fullName,
      guest_email: params.details.email,
      guest_phone: params.details.phone,
    })
    .eq('id', params.holdId);

  return {
    appointment,
    payment,
    providerOrderId: order.id,
    publicKey: provider.publicKey(),
    amountPaise: appointment.total_paise,
    currency: appointment.currency,
  };
}
