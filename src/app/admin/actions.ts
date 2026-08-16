'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/session';
import { writeAdminLog } from '@/lib/audit';
import { rupeesToPaise } from '@/lib/money';
import { queueNotification } from '@/lib/notifications/outbox';
import {
  serviceFormSchema, availabilityRuleSchema, availabilityExceptionSchema,
  leadUpdateSchema, appointmentNoteSchema,
} from '@/lib/validation/schemas';
import { clientIp } from '@/lib/rate-limit';

export type AdminActionState = { error?: string; success?: string } | null;

/**
 * Admin server actions.
 *
 * EVERY function here begins with `await requireAdmin()`. That is not
 * ceremonial: a server action is a POST endpoint with a generated URL, and it
 * is callable by anyone who can read the page source. Relying on the fact that
 * the button only renders inside /admin would be exactly the "hardcode admin
 * privileges in the frontend" mistake the brief rules out.
 *
 * Anything that changes someone else's data writes an admin_logs entry.
 */

async function requestMeta() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: h.get('user-agent') };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export async function saveService(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = formData.get('id') ? String(formData.get('id')) : null;

  const parsed = serviceFormSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    tagline: formData.get('tagline') ?? '',
    description: formData.get('description'),
    priceRupees: formData.get('priceRupees'),
    durationMinutes: formData.get('durationMinutes'),
    bufferMinutes: formData.get('bufferMinutes'),
    mode: formData.get('mode'),
    minNoticeHours: formData.get('minNoticeHours'),
    maxAdvanceDays: formData.get('maxAdvanceDays'),
    active: formData.get('active') === 'on',
    bookableOnline: formData.get('bookableOnline') === 'on',
    featured: formData.get('featured') === 'on',
    sortOrder: formData.get('sortOrder'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the values you entered.' };
  }

  const db = createAdminClient();
  const row = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    tagline: parsed.data.tagline || null,
    description: parsed.data.description,
    // Rupees in the form, paise in the database. This is the only conversion
    // point for admin-entered pricing.
    price_paise: rupeesToPaise(parsed.data.priceRupees),
    duration_minutes: parsed.data.durationMinutes,
    buffer_minutes: parsed.data.bufferMinutes,
    mode: parsed.data.mode,
    min_notice_hours: parsed.data.minNoticeHours,
    max_advance_days: parsed.data.maxAdvanceDays,
    active: parsed.data.active,
    bookable_online: parsed.data.bookableOnline,
    featured: parsed.data.featured,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = id
    ? await db.from('services').update(row).eq('id', id)
    : await db.from('services').insert(row);

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { error: 'A service with that URL slug already exists.' };
    }
    return { error: 'Could not save the service. Please try again.' };
  }

  const meta = await requestMeta();
  await writeAdminLog({
    adminId: admin.id,
    action: id ? 'service.update' : 'service.create',
    entityType: 'service',
    entityId: id,
    metadata: { title: row.title, price_paise: row.price_paise, active: row.active },
    ...meta,
  });

  // Prices appear on the public pages and in structured data, so those caches
  // must be dropped as well as the admin view.
  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/');
  return { success: id ? 'Service updated.' : 'Service created.' };
}

/**
 * Archive / restore a service.
 *
 * WHY THIS EXISTS INSTEAD OF A DELETE BUTTON
 *
 * `appointments.service_id` and `payments.appointment_id` are both ON DELETE
 * RESTRICT, so deleting a service that has ever been booked means deleting the
 * payment rows first. A payment row that no longer matches what Razorpay holds
 * is a reconciliation problem that outlives whatever tidiness it bought. So the
 * console offers archiving, and deletion stays a deliberate, manual SQL job —
 * see database/tools/delete-service.sql.
 *
 * Archiving sets `active = false` too. That is what keeps this change free of
 * any RLS edit: the public policy is already `active = true and internal =
 * false`, so an archived row is excluded by a policy nobody had to touch.
 *
 * Restoring clears `archived_at` and deliberately leaves `active = false`. The
 * service comes back into the admin list still hidden, so bringing it back is
 * two conscious steps rather than one click that silently republishes a price
 * to the homepage.
 */
export async function archiveService(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const restore = formData.get('restore') === '1';
  if (!id) return;

  const db = createAdminClient();
  const { data: before } = await db
    .from('services')
    .select('title, slug')
    .eq('id', id)
    .maybeSingle<{ title: string; slug: string }>();

  const { error } = await db
    .from('services')
    .update(
      restore
        ? { archived_at: null }
        : { archived_at: new Date().toISOString(), active: false },
    )
    .eq('id', id);

  // No UI for this failure: the row simply stays where it was and the list
  // re-renders unchanged. Log it so it is not invisible.
  if (error) {
    console.error('[admin] archiveService failed:', error.message);
    return;
  }

  const meta = await requestMeta();
  await writeAdminLog({
    adminId: admin.id,
    action: restore ? 'service.restore' : 'service.archive',
    entityType: 'service',
    entityId: id,
    metadata: { title: before?.title, slug: before?.slug },
    ...meta,
  });

  revalidatePath('/admin/services');
  revalidatePath('/services');
  revalidatePath('/');
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
export async function saveAvailabilityRule(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = formData.get('id') ? String(formData.get('id')) : null;

  const parsed = availabilityRuleSchema.safeParse({
    weekday: formData.get('weekday'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    slotIntervalMinutes: formData.get('slotIntervalMinutes'),
    label: formData.get('label') ?? '',
    active: formData.get('active') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the times you entered.' };
  }

  const db = createAdminClient();
  const row = {
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    slot_interval_minutes: parsed.data.slotIntervalMinutes,
    label: parsed.data.label || null,
    active: parsed.data.active,
  };

  const { error } = id
    ? await db.from('availability_rules').update(row).eq('id', id)
    : await db.from('availability_rules').insert(row);

  if (error) return { error: 'Could not save those working hours.' };

  await writeAdminLog({
    adminId: admin.id, action: id ? 'availability.update' : 'availability.create',
    entityType: 'availability_rule', entityId: id, metadata: row, ...(await requestMeta()),
  });

  revalidatePath('/admin/availability');
  return { success: 'Working hours saved.' };
}

export async function deleteAvailabilityRule(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const db = createAdminClient();
  await db.from('availability_rules').delete().eq('id', id);

  await writeAdminLog({
    adminId: admin.id, action: 'availability.delete', entityType: 'availability_rule',
    entityId: id, ...(await requestMeta()),
  });
  revalidatePath('/admin/availability');
}

export async function saveAvailabilityException(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const parsed = availabilityExceptionSchema.safeParse({
    date: formData.get('date'),
    startTime: formData.get('startTime') ?? '',
    endTime: formData.get('endTime') ?? '',
    available: formData.get('available') === 'on',
    reason: formData.get('reason') ?? '',
  });

  if (!parsed.success) return { error: 'Please check the date and times.' };

  // A whole-day block is start/end NULL. An "extra opening" must have times —
  // the database constraint enforces this too, but a friendly message beats a
  // constraint violation.
  if (parsed.data.available && (!parsed.data.startTime || !parsed.data.endTime)) {
    return { error: 'Adding extra hours needs both a start and an end time.' };
  }

  const db = createAdminClient();
  const { error } = await db.from('availability_exceptions').insert({
    date: parsed.data.date,
    start_time: parsed.data.startTime || null,
    end_time: parsed.data.endTime || null,
    available: parsed.data.available,
    reason: parsed.data.reason || null,
  });

  if (error) return { error: 'Could not save that exception.' };

  await writeAdminLog({
    adminId: admin.id, action: 'availability.exception', entityType: 'availability_exception',
    metadata: { ...parsed.data }, ...(await requestMeta()),
  });

  revalidatePath('/admin/availability');
  return { success: parsed.data.available ? 'Extra hours added.' : 'Date blocked.' };
}

export async function deleteAvailabilityException(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await createAdminClient().from('availability_exceptions').delete().eq('id', id);
  revalidatePath('/admin/availability');
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------
export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('appointmentId') ?? '');
  const status = String(formData.get('status') ?? '');

  const allowed = ['confirmed', 'completed', 'cancelled', 'no_show'];
  if (!id || !allowed.includes(status)) return;

  const db = createAdminClient();
  const { data: before } = await db.from('appointments').select('status').eq('id', id).maybeSingle();

  const patch: Record<string, unknown> = { status };
  if (status === 'completed') patch.completed_at = new Date().toISOString();
  if (status === 'cancelled') {
    patch.cancelled_at = new Date().toISOString();
    patch.cancelled_by = admin.id;
  }

  await db.from('appointments').update(patch).eq('id', id);

  // Cancelling frees the slot for someone else immediately.
  if (status === 'cancelled') {
    await db.from('slot_holds').update({ released_at: new Date().toISOString() })
      .eq('converted_appointment_id', id);
    await queueNotification({
      template: 'appointment_cancelled', appointmentId: id,
      dedupeKey: `admin_cancelled:${id}`,
    });
  }

  await writeAdminLog({
    adminId: admin.id, action: `appointment.${status}`, entityType: 'appointment', entityId: id,
    metadata: { from: before?.status, to: status }, ...(await requestMeta()),
  });

  revalidatePath('/admin/appointments');
  revalidatePath('/admin');
}

export async function saveMeetingLink(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('appointmentId') ?? '');
  const url = String(formData.get('meetingUrl') ?? '').trim();
  if (!id) return;

  // Only http(s). A `javascript:` URL here would end up rendered as a link in
  // the client's dashboard and in their confirmation email.
  if (url && !/^https?:\/\//i.test(url)) return;

  await createAdminClient().from('appointments').update({ meeting_url: url || null }).eq('id', id);

  await writeAdminLog({
    adminId: admin.id, action: 'appointment.meeting_link', entityType: 'appointment',
    entityId: id, ...(await requestMeta()),
  });
  revalidatePath('/admin/appointments');
}

export async function saveAppointmentNote(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();

  const parsed = appointmentNoteSchema.safeParse({
    appointmentId: formData.get('appointmentId'),
    body: formData.get('body'),
    followUpAt: formData.get('followUpAt') || null,
  });
  if (!parsed.success) return { error: 'Please write a note before saving.' };

  const db = createAdminClient();
  const { data: appointment } = await db
    .from('appointments').select('user_id').eq('id', parsed.data.appointmentId).maybeSingle();
  if (!appointment) return { error: 'That booking no longer exists.' };

  const { error } = await db.from('appointment_notes').insert({
    appointment_id: parsed.data.appointmentId,
    client_id: appointment.user_id,
    author_id: admin.id,
    body: parsed.data.body,
    follow_up_at: parsed.data.followUpAt ?? null,
  });

  if (error) return { error: 'Could not save that note.' };

  revalidatePath(`/admin/clients/${appointment.user_id}`);
  return { success: 'Note saved.' };
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export async function updateLead(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = leadUpdateSchema.safeParse({
    leadId: formData.get('leadId'),
    status: formData.get('status') || undefined,
    assignedNote: formData.get('assignedNote') || undefined,
  });
  if (!parsed.success) return;

  const patch: Record<string, unknown> = {};
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.assignedNote !== undefined) patch.assigned_note = parsed.data.assignedNote;
  if (parsed.data.status === 'contacted') patch.contacted_at = new Date().toISOString();

  await createAdminClient().from('leads').update(patch).eq('id', parsed.data.leadId);

  await writeAdminLog({
    adminId: admin.id, action: 'lead.update', entityType: 'lead', entityId: parsed.data.leadId,
    metadata: patch, ...(await requestMeta()),
  });
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------
export async function moderateTestimonial(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('testimonialId') ?? '');
  const action = String(formData.get('action') ?? '');
  if (!id) return;

  const db = createAdminClient();

  if (action === 'approve') {
    await db.from('testimonials')
      .update({ approved: true, approved_by: admin.id, approved_at: new Date().toISOString() })
      .eq('id', id);
  } else if (action === 'unapprove') {
    await db.from('testimonials').update({ approved: false, featured: false }).eq('id', id);
  } else if (action === 'feature') {
    await db.from('testimonials').update({ featured: true, approved: true }).eq('id', id);
  } else if (action === 'unfeature') {
    await db.from('testimonials').update({ featured: false }).eq('id', id);
  } else if (action === 'delete') {
    await db.from('testimonials').delete().eq('id', id);
  }

  await writeAdminLog({
    adminId: admin.id, action: `testimonial.${action}`, entityType: 'testimonial',
    entityId: id, ...(await requestMeta()),
  });

  revalidatePath('/admin/testimonials');
  revalidatePath('/');   // approved reviews render on the landing page
}

// ---------------------------------------------------------------------------
// Client notes
// ---------------------------------------------------------------------------
export async function saveClientNote(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const clientId = String(formData.get('clientId') ?? '');
  const notes = String(formData.get('notes') ?? '').slice(0, 4000);
  if (!clientId) return { error: 'Missing client.' };

  await createAdminClient().from('profiles').update({ notes }).eq('id', clientId);

  await writeAdminLog({
    adminId: admin.id, action: 'client.note', entityType: 'profile', entityId: clientId,
    ...(await requestMeta()),
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: 'Note saved.' };
}
