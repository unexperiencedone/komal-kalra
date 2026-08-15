import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RealStats } from '@/components/marketing/StatsBand';

/**
 * Real trust metrics for the landing page.
 *
 * Every value is a COUNT over actual rows. There is no configuration, no
 * override and no seed value — if the business has done twelve consultations,
 * this returns twelve, and StatsBand renders nothing.
 *
 * Failures return zeroes rather than throwing: a stats query is never worth
 * taking the homepage down for.
 */
export async function getRealStats(): Promise<RealStats> {
  const empty: RealStats = { consultations: 0, clients: 0, averageRating: 0, reviewCount: 0 };

  try {
    const admin = createAdminClient();

    const [completed, clients, reviews] = await Promise.all([
      admin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('appointments_count', 0),
      admin
        .from('testimonials')
        .select('rating')
        .eq('approved', true),
    ]);

    const ratings = (reviews.data ?? []).map((r) => r.rating as number);
    const averageRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      consultations: completed.count ?? 0,
      clients: clients.count ?? 0,
      averageRating,
      reviewCount: ratings.length,
    };
  } catch {
    return empty;
  }
}
