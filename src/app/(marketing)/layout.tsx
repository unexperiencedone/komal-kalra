import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { getActiveServices } from '@/lib/booking/availability';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Marketing shell.
 *
 * `pt-20` on <main> offsets the fixed 80px navigation — the design's nav is
 * `fixed`, so without this every page's first section would sit underneath it.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [services, user] = await Promise.all([getActiveServices(), getCurrentUser()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main id="main" className="flex-1 pt-20 md:pt-32">{children}</main>
      <SiteFooter services={services} />
    </div>
  );
}
