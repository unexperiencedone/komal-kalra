import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { toolLeadSchema } from './schemas';
import type { z } from 'zod';

/**
 * Record a free-tool submission as a lead.
 *
 * ⚠️  BIRTH DETAILS ARE NOT STORED HERE.
 *
 * The lead keeps a name, an email, an optional phone and WHICH tool was used.
 * The date, time and place of birth are used to compute the result and then
 * discarded — they live only in the cache, keyed by a hash, with no link back
 * to a person.
 *
 * That is a deliberate limit, not an oversight. Birth date-time-place is
 * unusually identifying, and under the DPDP Act's purpose limitation the
 * lawful basis for collecting it is "to run the calculation you asked for",
 * not "to hold indefinitely in a marketing table". Storing it alongside a name
 * and email would turn a calculator into a personal-data store, and would need
 * its own retention schedule, erasure workflow and notice.
 *
 * If Komal ever wants the birth details retained — to prepare for a
 * consultation, say — that is a legitimate purpose, but it needs consent
 * collected for THAT purpose, a stated retention period, and an entry in
 * docs/legal-compliance.md §5.2. Do not quietly widen this function.
 *
 * MARKETING CONSENT IS NOT IMPLIED. Using a calculator is consent to receive
 * its result. It is not consent to be marketed to, and nothing here sets a
 * marketing opt-in.
 */
export async function recordToolLead(params: {
  lead: z.infer<typeof toolLeadSchema>;
  toolSlug: string;
  toolTitle: string;
  ip?: string | null;
}): Promise<void> {
  const db = createAdminClient();

  const { error } = await db.from('leads').insert({
    name: params.lead.name,
    email: params.lead.email,
    phone: params.lead.phone?.trim() || null,
    message: `Used the free tool: ${params.toolTitle} (${params.toolSlug})`,
    source: 'contact_form',
    status: 'new',
  });

  // A failed lead write must NOT fail the request. The visitor asked for a
  // calculation and we have one; refusing to show it because a CRM row did not
  // save punishes them for our problem. Logged loudly instead.
  if (error) {
    console.error('[astrology] lead insert failed:', error.message);
  }
}
