/**
 * Database types.
 *
 * Hand-maintained rather than generated, so that the shapes carry the same
 * invariants the SQL does (paise as integers, discriminated status unions).
 * Regenerate-and-replace is possible later with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type UserRole = 'client' | 'admin';

export type AppointmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'
  | 'needs_attention';

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentProvider = 'razorpay' | 'stripe' | 'manual';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
export type LeadSource =
  | 'contact_form' | 'abandoned_booking' | 'phone' | 'instagram' | 'referral' | 'other';
export type DiscountType = 'percentage' | 'fixed';
export type ServiceMode = 'video' | 'phone' | 'in_person';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  birth_time_known: boolean;
  preferred_language: string;
  marketing_opt_in: boolean;
  total_spent_paise: number;
  appointments_count: number;
  last_appointment_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  highlights: string[];
  ideal_for: string[];
  /** paise */
  price_paise: number;
  compare_at_paise: number | null;
  currency: string;
  duration_minutes: number;
  buffer_minutes: number;
  mode: ServiceMode;
  active: boolean;
  bookable_online: boolean;
  featured: boolean;
  sort_order: number;
  /**
   * Staff-only row, hidden from the public catalogue by row-level security.
   * Distinct from `active = false`, which means "not bookable at all".
   * See database/04_services.sql.
   *
   * OPTIONAL ON PURPOSE. A deployment can be running ahead of its migration,
   * and on a database without this column the field is simply absent from the
   * row. Typing it as a required `boolean` claims a guarantee the database is
   * not making, and the code that trusted that guarantee blanked the entire
   * catalogue once. Always test `internal === true` / `!== true`, never rely on
   * it being present.
   */
  internal?: boolean;
  /**
   * When the service was retired from the admin console. `null`/absent = live.
   * Archiving also sets `active = false`, so archived rows are already excluded
   * from the public catalogue by the existing RLS policy.
   *
   * Optional for the same reason as `internal` — a deployment can be running
   * ahead of its migration. Test `archived_at ? … : …`, never assume presence.
   */
  archived_at?: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  free_cancellation_hours: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  reference: string;
  user_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  price_paise: number;
  discount_paise: number;
  tax_paise: number;
  total_paise: number;
  currency: string;
  coupon_id: string | null;
  service_title_snapshot: string;
  duration_minutes: number;
  client_question: string | null;
  subject_name: string | null;
  subject_birth_date: string | null;
  subject_birth_time: string | null;
  subject_birth_place: string | null;
  subject_birth_time_known: boolean;
  meeting_url: string | null;
  meeting_notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  rescheduled_from_id: string | null;
  rescheduled_to_id: string | null;
  reschedule_requested_at: string | null;
  hold_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  user_id: string;
  provider: PaymentProvider;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  amount_paise: number;
  amount_refunded_paise: number;
  currency: string;
  status: PaymentStatus;
  verified_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  method: string | null;
  error_code: string | null;
  error_description: string | null;
  idempotency_key: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  provider_refund_id: string | null;
  amount_paise: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  reason: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  provider: PaymentProvider;
  event_id: string;
  event_type: string;
  payment_id: string | null;
  appointment_id: string | null;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  payload: Record<string, unknown>;
  signature: string | null;
  processed: boolean;
  processed_at: string | null;
  processing_error: string | null;
  attempts: number;
  received_at: string;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  active: boolean;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  available: boolean;
  reason: string | null;
  created_at: string;
}

export interface SlotHold {
  id: string;
  service_id: string;
  user_id: string | null;
  session_key: string;
  starts_at: string;
  ends_at: string;
  expires_at: string;
  released_at: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  converted_appointment_id: string | null;
  lead_captured: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  user_id: string | null;
  service_id: string | null;
  appointment_id: string | null;
  author_name: string;
  author_location: string | null;
  display_initials_only: boolean;
  rating: number;
  review: string;
  approved: boolean;
  featured: boolean;
  sort_order: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  service_id: string | null;
  intended_slot_at: string | null;
  slot_hold_id: string | null;
  user_id: string | null;
  assigned_note: string | null;
  follow_up_at: string | null;
  contacted_at: string | null;
  converted_appointment_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  action_url: string | null;
  category: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_paise: number | null;
  min_order_paise: number;
  service_ids: string[] | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  times_used: number;
  starts_at: string;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentNote {
  id: string;
  appointment_id: string;
  client_id: string;
  author_id: string;
  body: string;
  follow_up_at: string | null;
  follow_up_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Result of public.confirm_appointment_payment(). */
export type ConfirmResult =
  | { result: 'confirmed'; payment_id: string; appointment_id: string; reference: string }
  | { result: 'already_confirmed'; payment_id: string; appointment_id?: string }
  | { result: 'slot_conflict'; payment_id: string; appointment_id: string }
  | { result: 'amount_mismatch'; expected: number; received: number }
  | { result: 'illegal_transition'; from: PaymentStatus; to: PaymentStatus }
  | { result: 'appointment_missing'; payment_id: string }
  | { result: 'not_found' };

export interface RevenueSummary {
  gross_paise: number;
  refunded_paise: number;
  net_paise: number;
  paid_count: number;
  failed_count: number;
  refund_count: number;
  attempt_count: number;
  avg_order_paise: number;
  conversion_rate: number;
}

/** Joined shapes used by the dashboards. */
export type AppointmentWithService = Appointment & { services: Pick<Service, 'slug' | 'title' | 'mode' | 'duration_minutes'> | null };
export type AppointmentWithClient = Appointment & { profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null };
export type PaymentWithContext = Payment & {
  appointments: Pick<Appointment, 'id' | 'reference' | 'starts_at' | 'service_title_snapshot' | 'status'> | null;
  profiles: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
};
