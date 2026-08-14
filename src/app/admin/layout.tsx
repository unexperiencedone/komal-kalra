import {
  BarChart3, CalendarDays, CalendarRange, CreditCard, LayoutDashboard,
  MessageSquareQuote, Sparkles, UserRound, Users,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/login/actions';
import { AppShell } from '@/components/dashboard/AppShell';

/**
 * Admin shell.
 *
 * THIS is the admin authorisation boundary, not proxy.ts.
 *
 * requireAdmin() re-reads the caller's role from the database on every request
 * and redirects a non-admin to /dashboard. The proxy redirect exists purely so
 * a signed-out visitor does not see a flash of the console before bouncing —
 * it is a UX affordance and is explicitly documented as not being the control.
 * Every /api/admin/* handler repeats the check independently.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const admin = createAdminClient();

  // Badge counts for the things that genuinely need a human.
  const [{ count: newLeads }, { count: attention }] = await Promise.all([
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'needs_attention'),
  ]);

  const nav = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, badge: attention ?? 0 },
    { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/leads', label: 'Leads', icon: UserRound, badge: newLeads ?? 0 },
    { href: '/admin/services', label: 'Services', icon: Sparkles },
    { href: '/admin/availability', label: 'Availability', icon: CalendarRange },
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <AppShell
      nav={nav}
      title="Admin console"
      user={{ name: profile.full_name, email: profile.email, role: profile.role }}
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
