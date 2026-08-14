import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { getActiveServices } from '@/lib/booking/availability';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Marketing shell.
 *
 * A Server Component: the header and footer render on the server, and the only
 * JavaScript this layout sends to the browser is the header's mobile-menu
 * island. That is what keeps the public pages at effectively zero client-side
 * JS for content (docs/research.md §11).
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [services, user] = await Promise.all([getActiveServices(), getCurrentUser()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter services={services} />
    </div>
  );
}
