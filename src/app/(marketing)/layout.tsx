import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { WhatsAppButton } from '@/components/marketing/WhatsAppButton';
import { getActiveServices } from '@/lib/booking/availability';

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
/**
 * NO AUTH READ IN THIS LAYOUT.
 *
 * It used to call `getCurrentUser()` so the header could point "Login" at
 * `/dashboard` for signed-in visitors. That is a cookie read, and this layout
 * wraps every marketing route including the prerendered `/services/[slug]` —
 * so it made a static route reach for request state, which is what threw
 * DYNAMIC_SERVER_USAGE and 500'd on Vercel's ISR path.
 *
 * The header now always links to `/login`, and `/login` redirects an
 * already-signed-in visitor onward to their own dashboard. Same destination,
 * one redirect, and it is better behaviour anyway — a signed-in person landing
 * on a sign-in form is a bug in its own right.
 *
 * It also removes a `supabase.auth.getUser()` round trip from every marketing
 * page render, which was a network call on the critical path of the homepage.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const services = await getActiveServices();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter services={services} />
      <WhatsAppButton />
    </div>
  );
}
