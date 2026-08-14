'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/**
 * Shared shell for both /dashboard and /admin.
 *
 * One component for both because the chrome is genuinely the same problem —
 * sidebar, mobile drawer, active state, user menu — and maintaining two copies
 * guarantees they drift. What differs (nav items, title, accent) is passed in.
 *
 * Rendering the nav does NOT imply authorisation. Every page behind these links
 * calls requireUser()/requireAdmin() itself.
 */
export function AppShell({
  nav,
  title,
  user,
  signOutAction,
  children,
}: {
  nav: NavItem[];
  title: string;
  user: { name: string | null; email: string; role: string };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === pathname || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(`${href}/`));

  const navList = (
    <nav aria-label={title} className="flex-1 space-y-0.5 px-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(item.href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors',
            isActive(item.href)
              ? 'bg-[var(--color-saffron-tint)] text-[var(--color-ember)]'
              : 'text-[var(--color-bark)] hover:bg-[var(--color-linen)] hover:text-[var(--color-ink)]',
          )}
        >
          <item.icon className="size-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="tabular rounded-full bg-[var(--color-clay)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-[var(--color-linen)] p-3">
      <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-sand)]"
        >
          {initials(user.name ?? user.email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-ink)]">{user.name ?? 'Your account'}</p>
          <p className="truncate text-xs text-[var(--color-stone)]">{user.email}</p>
        </div>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="sm" full className="mt-1 justify-start">
          Sign out
        </Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--color-sand)] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-linen)] bg-white lg:flex lg:h-dvh lg:sticky lg:top-0">
        <div className="border-b border-[var(--color-linen)] p-5">
          <Link href="/" className="block">
            <span className="block font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
              Komal Kalra
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-stone)]">
              {title}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">{navList}</div>
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-linen)] bg-white px-4 lg:hidden">
        <Link href="/" className="font-[family-name:var(--font-display)] text-base font-semibold">
          Komal Kalra
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="app-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 flex size-10 items-center justify-center rounded-[var(--radius-control)]"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open && (
        <div id="app-nav" className="border-b border-[var(--color-linen)] bg-white py-4 lg:hidden">
          {navList}
          {footer}
        </div>
      )}

      <main id="main" className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

/** Page header used by every dashboard and admin screen. */
export function PageHeader({
  title, description, action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-linen)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--color-stone)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label, value, sublabel, tone = 'neutral', icon: Icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tones = {
    neutral: 'text-[var(--color-ink)]',
    success: 'text-[var(--color-sage)]',
    warning: 'text-[var(--color-amber-warn)]',
    danger: 'text-[var(--color-clay)]',
  };
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-stone)]">{label}</p>
        {Icon && <Icon className="size-4 text-[var(--color-stone)]" />}
      </div>
      <p className={cn('tabular mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold', tones[tone])}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-[var(--color-stone)]">{sublabel}</p>}
    </div>
  );
}
