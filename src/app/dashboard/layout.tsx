import { requireUser, getAvatarUrl } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import { AppShell, type NavItem } from '@/components/dashboard/AppShell';

/**
 * Client dashboard shell.
 *
 * requireUser() runs here, so every page under /dashboard is protected by the
 * layout rather than by each page remembering to check. The proxy redirect is
 * belt; this is braces.
 *
 * An admin who lands here is NOT bounced — an admin is also a person who may
 * have their own bookings, and forcing them out of /dashboard would be
 * gratuitous. /admin is where the privileged surface lives.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser('/dashboard');
  const avatarUrl = await getAvatarUrl();
  const supabase = await createClient();

  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);

  const nav: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: 'LayoutDashboard', badge: unread ?? 0 },
    { href: '/dashboard/appointments', label: 'Appointments', icon: 'CalendarDays' },
    { href: '/dashboard/payments', label: 'Payments', icon: 'CreditCard' },
    { href: '/dashboard/profile', label: 'Profile', icon: 'User' },
  ];

  return (
    <AppShell
      nav={nav}
      title="Your Account"
      user={{ name: profile.full_name, email: profile.email, role: profile.role, avatarUrl }}
      signOutAction={signOut}
      primaryAction={{ href: '/book', label: 'Book a Session' }}
    >
      {children}
    </AppShell>
  );
}
