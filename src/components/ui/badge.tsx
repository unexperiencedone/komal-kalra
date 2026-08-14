import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AppointmentStatus, PaymentStatus } from '@/types/database';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--color-linen)] text-[var(--color-bark)]',
        success: 'bg-[var(--color-sage-tint)] text-[var(--color-sage)]',
        warning: 'bg-[var(--color-amber-tint)] text-[var(--color-amber-warn)]',
        danger: 'bg-[var(--color-clay-tint)] text-[var(--color-clay)]',
        accent: 'bg-[var(--color-saffron-tint)] text-[var(--color-ember)]',
        info: 'bg-[var(--color-indigo-tint)] text-[var(--color-indigo)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * Status colour is centralised so the same state never renders two different
 * colours in two different tables — a small thing that badly undermines trust
 * in a financial dashboard.
 */
const APPOINTMENT_TONE: Record<AppointmentStatus, { tone: BadgeProps['tone']; label: string }> = {
  pending_payment: { tone: 'warning', label: 'Awaiting payment' },
  confirmed: { tone: 'success', label: 'Confirmed' },
  completed: { tone: 'neutral', label: 'Completed' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  no_show: { tone: 'danger', label: 'No show' },
  rescheduled: { tone: 'info', label: 'Rescheduled' },
  needs_attention: { tone: 'danger', label: 'Needs attention' },
};

const PAYMENT_TONE: Record<PaymentStatus, { tone: BadgeProps['tone']; label: string }> = {
  created: { tone: 'neutral', label: 'Created' },
  pending: { tone: 'warning', label: 'Pending' },
  processing: { tone: 'warning', label: 'Processing' },
  paid: { tone: 'success', label: 'Paid' },
  failed: { tone: 'danger', label: 'Failed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  refunded: { tone: 'info', label: 'Refunded' },
  partially_refunded: { tone: 'info', label: 'Partly refunded' },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPOINTMENT_TONE[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_TONE[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
