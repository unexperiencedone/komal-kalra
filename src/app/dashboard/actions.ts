'use server';

/*
 * ⚠️  cancelAppointment and requestReschedule USED TO LIVE HERE. They are gone
 * because bookings are final and a change of time is arranged by phone.
 *
 * Do not reinstate them without also changing
 * `protect_appointment_columns()` — the database rejects any client-initiated
 * status change, so a restored action would fail at the trigger rather than
 * work. That ordering is deliberate: the rule lives in one place, and the UI
 * only reflects it.
 *
 * Komal's own cancel/reschedule/refund powers are untouched. They run through
 * src/app/admin/actions.ts on the service-role client, which the trigger lets
 * through.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { profileSchema, testimonialSchema } from '@/lib/validation/schemas';

export type ActionState = { error?: string; success?: string } | null;

/**
 * Profile update.
 *
 * Uses the ANON-key client, not the service role. That is deliberate: RLS then
 * enforces that a user can only write their own row, so a bug in this function
 * cannot become a way to edit someone else's profile. The `role` column is
 * additionally protected by protect_profile_role() at the database level.
 */
export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || '',
    birthDate: formData.get('birthDate') || '',
    birthTime: formData.get('birthTime') || '',
    birthPlace: formData.get('birthPlace') || '',
    birthTimeKnown: formData.get('birthTimeKnown') === 'on',
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the details you entered.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      birth_date: parsed.data.birthDate || null,
      birth_time: parsed.data.birthTimeKnown ? parsed.data.birthTime || null : null,
      birth_place: parsed.data.birthPlace || null,
      birth_time_known: parsed.data.birthTimeKnown,
      marketing_opt_in: parsed.data.marketingOptIn,
    })
    .eq('id', (await supabase.auth.getUser()).data.user!.id);

  if (error) return { error: 'We could not save those changes. Please try again.' };

  revalidatePath('/dashboard/profile');
  return { success: 'Your details have been saved.' };
}



/**
 * Leave a review for a completed session.
 *
 * ⚠️  ANON-KEY CLIENT, NOT THE SERVICE ROLE — and that is the security model,
 * not a stylistic preference.
 *
 * `testimonials_insert_own_completed` in 12_testimonials.sql already verifies,
 * in its WITH CHECK, that:
 *
 *   • the row's user_id is the caller,
 *   • approved and featured are both false,
 *   • and the appointment_id belongs to that caller AND is `completed`.
 *
 * Using the service role here would bypass all of it and leave the checks to
 * this function, which is exactly the arrangement where someone later adds a
 * branch and quietly opens a hole. Going through RLS means a bug in this file
 * cannot produce a review for a session that never happened.
 *
 * `approved: false` is set explicitly rather than left to the column default.
 * Nothing reaches the site until Komal approves it in /admin/testimonials — the
 * homepage renders no testimonial section at all until approved rows exist, and
 * it has never had placeholder reviews to fall back on.
 */
export async function submitTestimonial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();

  const parsed = testimonialSchema.safeParse({
    appointmentId: formData.get('appointmentId'),
    rating: formData.get('rating'),
    review: formData.get('review'),
    authorName: formData.get('authorName'),
    authorLocation: formData.get('authorLocation') ?? '',
    displayInitialsOnly: formData.get('displayInitialsOnly') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in again.' };

  // The service is recorded alongside the review so Komal can see which kind of
  // session it refers to, and so a review can be shown on that service's page
  // rather than only on the homepage.
  const { data: appointment } = await supabase
    .from('appointments')
    .select('service_id')
    .eq('id', parsed.data.appointmentId)
    .maybeSingle<{ service_id: string | null }>();

  const { error } = await supabase.from('testimonials').insert({
    user_id: user.id,
    appointment_id: parsed.data.appointmentId,
    service_id: appointment?.service_id ?? null,
    author_name: parsed.data.authorName,
    author_location: parsed.data.authorLocation || null,
    display_initials_only: parsed.data.displayInitialsOnly,
    rating: parsed.data.rating,
    review: parsed.data.review,
    approved: false,
    featured: false,
  });

  if (error) {
    // 23505 is the one-review-per-appointment unique index. Everything else is
    // either RLS refusing a session that is not completed, or a real fault —
    // both of which should read as "we could not save this", not as a hint
    // about the schema.
    if ((error as { code?: string }).code === '23505') {
      return { error: 'You have already left a review for this session.' };
    }
    console.error('[testimonial] insert failed:', error.message);
    return { error: 'We could not save your review. Please try again.' };
  }

  revalidatePath(`/dashboard/appointments/${parsed.data.appointmentId}`);
  return {
    success:
      'Thank you — your review has been sent to Komal. It appears on the site once she has read it.',
  };
}
