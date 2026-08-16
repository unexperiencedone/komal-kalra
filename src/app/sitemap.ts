import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Dynamic sitemap.
 *
 * Service pages are read from the database rather than hardcoded, so publishing
 * a service from the admin panel puts it in the sitemap without a deploy.
 *
 * Application routes (/book, /dashboard, /admin, /login) are deliberately
 * absent: indexing a booking funnel produces thin duplicate pages that compete
 * with the service pages we actually want to rank.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/refunds`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/delivery`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('services')
      .select('slug, updated_at, internal')
      .eq('active', true);

    // Service-role client, so RLS does not apply here — internal rows have to
    // be excluded explicitly or the ₹1 verification service gets advertised to
    // Google. Filtered in JS rather than with `.eq('internal', false)` so a
    // database that has not run the migration still produces a sitemap; see
    // the note in src/lib/booking/availability.ts.
    const serviceRoutes: MetadataRoute.Sitemap = (data ?? [])
      .filter((s) => s.internal !== true)
      .map((s) => ({
        url: `${base}/services/${s.slug}`,
        lastModified: new Date(s.updated_at as string),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));

    return [...staticRoutes, ...serviceRoutes];
  } catch {
    // A sitemap that fails to build must not take the whole site down with it.
    return staticRoutes;
  }
}
