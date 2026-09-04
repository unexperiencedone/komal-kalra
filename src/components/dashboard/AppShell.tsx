'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LogOut, Menu, Plus, X,
  LayoutDashboard, CalendarDays, CreditCard, User, Users, UserRound,
  Sparkles, CalendarRange, MessageSquareQuote, BarChart3, ClipboardClock, IndianRupee,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { BRAND } from '@/lib/config';

/**
 * Icon registry, keyed by name rather than component reference.
 *
 * This file is 'use client', but the nav arrays and stat configs that use it
 * are built in Server Component layouts/pages. A component reference is a
 * function, and a function cannot be passed as a prop across the Server-to-
 * Client boundary — only the plain string name can. So callers pass a name,
 * and the actual lucide-react component is resolved here, entirely
 * client-side. Add an icon here before referencing its name elsewhere.
 */
const ICONS = {
  LayoutDashboard, CalendarDays, CreditCard, User, Users, UserRound,
  Sparkles, CalendarRange, MessageSquareQuote, BarChart3, ClipboardClock, IndianRupee,
} as const;

export type IconName = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
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
  primaryAction,
  children,
}: {
  nav: NavItem[];
  title: string;
  user: { name: string | null; email: string; role: string; avatarUrl?: string | null };
  signOutAction: () => Promise<void>;
  /** The one filled CTA in the sidebar, as in the console design. */
  primaryAction?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === pathname || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(`${href}/`));

  const navList = (
    <nav aria-label={title} className="flex-1 space-y-1 px-3">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3  px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-[var(--color-cream)] text-[var(--color-cocoa)]'
                : 'text-[var(--color-body-warm)] hover:bg-[var(--color-outline-variant)] hover:text-[var(--color-cocoa)]',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="label-small tabular border border-current px-1.5 py-0.5">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-[var(--color-outline-variant)] p-3">
      <div className="flex items-center gap-2.5  px-2 py-2">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cocoa)] text-xs font-semibold text-[var(--color-card-cream)]"
          >
            {initials(user.name ?? user.email)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[var(--color-cocoa)]">{user.name ?? 'Your account'}</p>
          <p className="truncate text-xs text-[var(--color-body-warm)]">{user.email}</p>
        </div>
      </div>
      {/* Plain <button>, not the Button component: the console's sign-out is a
          quiet nav row in the design, not a bordered control. */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-4 px-2 py-3 text-base text-[var(--color-body-warm)] transition-colors hover:text-[var(--color-cocoa)]"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--color-surface)] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--color-hairline)] bg-[var(--color-card-cream)] lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-6 pb-8 pt-10 text-center">
          <Link href="/" className="inline-block">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={80}
                height={80}
                className="mx-auto size-20 rounded-full border border-[var(--color-hairline)] object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="mx-auto flex size-20 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-cream)] font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]"
              >
                {initials(user.name ?? user.email)}
              </span>
            )}
            <span className="mt-5 block font-[family-name:var(--font-display)] text-2xl font-medium leading-tight text-[var(--color-cocoa)]">
              {title}
            </span>
            <span className="label-small mt-2 block text-[var(--color-body-warm)]">
              {BRAND.fullName}
            </span>
          </Link>
        </div>

        {primaryAction && (
          <div className="px-6 pb-6">
            <Link
              href={primaryAction.href}
              className="label-caps flex w-full items-center justify-center gap-2 bg-[var(--color-cocoa)] px-5 py-4 text-[var(--color-card-cream)] transition-colors hover:bg-[var(--color-ink-black)]"
            >
              <Plus className="size-4" aria-hidden />
              {primaryAction.label}
            </Link>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">{navList}</div>
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--color-hairline)] bg-[var(--color-card-cream)] px-6 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)]">
          <Image src="/images/favicon_new.png" alt="" width={28} height={28} className="size-7" />
          {BRAND.name}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="app-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 flex size-10 items-center justify-center "
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open && (
        <div id="app-nav" className="border-b border-[var(--color-hairline)] bg-[var(--color-card-cream)] py-4 lg:hidden">
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
    <div className="flex flex-col gap-4 border-b border-[var(--color-hairline)] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-h1)] font-medium text-[var(--color-cocoa)]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-body-warm)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Stat tile from the Practitioner Console.
 *
 * Icon and a small pill label on the top row, a large Playfair figure, then a
 * hairline and a trend line beneath. `inverted` renders the navy tile the
 * design uses for the single most important figure on the screen (revenue) —
 * one per row, otherwise the emphasis stops meaning anything.
 */
export function StatCard({
  label, value, sublabel, pill, icon, inverted = false, tone = 'neutral',
}: {
  label: string;
  value: string;
  sublabel?: string;
  /** Small right-aligned qualifier, e.g. "This Month" / "YTD". */
  pill?: string;
  icon?: IconName;
  inverted?: boolean;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const Icon = icon ? ICONS[icon] : null;
  const toneClass = inverted
    ? 'text-[var(--color-saffron-lift)]'
    : {
        neutral: 'text-[var(--color-cocoa)]',
        success: 'text-[var(--color-success)]',
        warning: 'text-[var(--color-warning)]',
        danger: 'text-[var(--color-error)]',
      }[tone];

  return (
    <div
      className={cn(
        'flex flex-col border p-6',
        inverted
          ? 'border-[var(--color-cocoa)] bg-[var(--color-cocoa)]'
          : 'border-[var(--color-hairline)] bg-[var(--color-cream)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <Icon
            className={cn(
              'size-6',
              inverted ? 'text-[var(--color-saffron-lift)]' : 'text-[var(--color-saffron)]',
            )}
          />
        )}
        {pill && (
          <span
            className={cn(
              'label-small border px-2.5 py-1',
              inverted
                ? 'border-[color-mix(in_srgb,var(--color-card-cream)_25%,transparent)] text-[var(--color-card-cream)]'
                : 'border-[var(--color-outline-variant)] bg-[var(--color-card-cream)] text-[var(--color-body-warm)]',
            )}
          >
            {pill}
          </span>
        )}
      </div>

      <p className={cn('tabular mt-6 font-[family-name:var(--font-display)] text-4xl font-medium', toneClass)}>
        {value}
      </p>
      <p
        className={cn(
          'mt-1 text-base',
          inverted ? 'text-[var(--color-card-cream)]' : 'text-[var(--color-body-warm)]',
        )}
      >
        {label}
      </p>

      {sublabel && (
        <p
          className={cn(
            'mt-5 border-t pt-4 text-sm',
            inverted
              ? 'border-[color-mix(in_srgb,var(--color-card-cream)_18%,transparent)] text-[var(--color-on-primary-container)]'
              : 'border-[var(--color-hairline)] text-[var(--color-body-warm)]',
          )}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
