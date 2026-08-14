import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  Appointment, AppointmentWithClient, AppointmentWithService,
  Notification, Payment, PaymentWithContext,
} from '@/types/database';

/**
 * Read models.
 *
 * User-scoped reads go through the anon-key client so RLS enforces ownership —
 * the query does not have to remember to filter by user_id, and a mistake in
 * the filter cannot leak another client's data. Admin-scoped reads use the
 * service key AFTER requireAdmin() has run.
 */

// ---------------------------------------------------------------------------
// Client-facing
// ---------------------------------------------------------------------------
export async function getMyAppointments(): Promise<AppointmentWithService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('*, services(slug, title, mode, duration_minutes)')
    .order('starts_at', { ascending: false })
    .returns<AppointmentWithService[]>();
  return data ?? [];
}

export async function getMyAppointment(id: string): Promise<AppointmentWithService | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('*, services(slug, title, mode, duration_minutes)')
    .eq('id', id)
    .maybeSingle<AppointmentWithService>();
  return data;
}

export async function getMyPayments(): Promise<Payment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Payment[]>();
  return data ?? [];
}

export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<Notification[]>();
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Admin. Every function here assumes requireAdmin() has already passed.
// ---------------------------------------------------------------------------
export async function getAppointmentsForAdmin(params: {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
}): Promise<AppointmentWithClient[]> {
  const admin = createAdminClient();
  let query = admin
    .from('appointments')
    .select('*, profiles!appointments_user_id_fkey(id, full_name, email, phone)')
    .order('starts_at', { ascending: false })
    .limit(params.limit ?? 100);

  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params.from) query = query.gte('starts_at', params.from);
  if (params.to) query = query.lte('starts_at', params.to);
  if (params.search) query = query.ilike('reference', `%${params.search}%`);

  const { data } = await query.returns<AppointmentWithClient[]>();
  return data ?? [];
}

export async function getTodaysAppointments(): Promise<AppointmentWithClient[]> {
  const admin = createAdminClient();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const { data } = await admin
    .from('appointments')
    .select('*, profiles!appointments_user_id_fkey(id, full_name, email, phone)')
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .in('status', ['confirmed', 'pending_payment', 'completed'])
    .order('starts_at', { ascending: true })
    .returns<AppointmentWithClient[]>();
  return data ?? [];
}

export async function getPaymentsForAdmin(params: {
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<PaymentWithContext[]> {
  const admin = createAdminClient();
  let query = admin
    .from('payments')
    .select(
      '*, appointments(id, reference, starts_at, service_title_snapshot, status), ' +
      'profiles!payments_user_id_fkey(id, full_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 100);

  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params.from) query = query.gte('created_at', params.from);
  if (params.to) query = query.lte('created_at', params.to);

  const { data } = await query.returns<PaymentWithContext[]>();
  return data ?? [];
}

export async function getRevenueSummary(from: Date, to: Date) {
  const admin = createAdminClient();
  const { data } = await admin.rpc('revenue_summary', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  return data as import('@/types/database').RevenueSummary | null;
}

export async function getRevenueByService(from: Date, to: Date) {
  const admin = createAdminClient();
  const { data } = await admin.rpc('revenue_by_service', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  return (data ?? []) as { service_title: string; bookings: number; net_paise: number }[];
}

export async function getRevenueTimeseries(from: Date, to: Date) {
  const admin = createAdminClient();
  const { data } = await admin.rpc('revenue_timeseries', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  return (data ?? []) as { day: string; net_paise: number; bookings: number }[];
}

/**
 * Things that need a human decision, surfaced at the top of the admin home.
 * Deliberately a single query set rather than a generic "alerts" abstraction —
 * there are exactly four cases and naming them keeps the dashboard honest.
 */
export async function getPendingActions() {
  const admin = createAdminClient();

  const [needsAttention, failedPayments, newLeads, pendingTestimonials] = await Promise.all([
    admin.from('appointments').select('id, reference, starts_at, total_paise', { count: 'exact' })
      .eq('status', 'needs_attention').limit(5),
    admin.from('payments').select('id, amount_paise, created_at, error_description', { count: 'exact' })
      .eq('status', 'failed').gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString()).limit(5),
    admin.from('leads').select('id, name, created_at', { count: 'exact' })
      .eq('status', 'new').limit(5),
    admin.from('testimonials').select('id, author_name, rating', { count: 'exact' })
      .eq('approved', false).limit(5),
  ]);

  return {
    needsAttention: { count: needsAttention.count ?? 0, items: needsAttention.data ?? [] },
    failedPayments: { count: failedPayments.count ?? 0, items: failedPayments.data ?? [] },
    newLeads: { count: newLeads.count ?? 0, items: newLeads.data ?? [] },
    pendingTestimonials: { count: pendingTestimonials.count ?? 0, items: pendingTestimonials.data ?? [] },
  };
}

export async function getAppointmentForAdmin(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('appointments')
    .select(
      '*, profiles!appointments_user_id_fkey(*), services(*), ' +
      'payments(*), appointment_notes(*)',
    )
    .eq('id', id)
    .maybeSingle();
  return data as (Appointment & Record<string, unknown>) | null;
}
