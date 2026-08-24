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
import { profileSchema } from '@/lib/validation/schemas';

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


