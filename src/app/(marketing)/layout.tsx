import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { getActiveServices } from '@/lib/booking/availability';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Marketing shell.
 *
 * NO TOP PADDING ON <main>, and the header is `sticky` rather than `fixed`.
 *
 * It used to be `fixed` with `pt-20 md:pt-32` here to compensate. Two problems
 * with that, one cosmetic and one structural:
 *
 *  • That padding belongs to <main>, which inherits the cream page background.
 *    So on every page whose first section is terracotta — which is all of them —
 *    a 128px cream stripe appeared between the header and the hero. It looked
 *    like a border or a rendering fault; it was just the page showing through
 *    the gap the header had been lifted out of.
 *
 *  • The value was a hardcoded guess at the header's height. The header is two
 *    rows and its height depends on the wordmark's font size, so the guess was
 *    wrong at some breakpoints and would drift again the moment the nav changed.
 *
 * `sticky` occupies its own space in normal flow and sticks on scroll, so the
 * offset is exactly right by construction and there is nothing to keep in sync.
 * The hide-on-scroll transform still works — a translated sticky element slides
 * out of view the same way a fixed one does.
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
