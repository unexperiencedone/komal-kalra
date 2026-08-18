import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { AppointmentStatus, PaymentStatus } from '@/types/database';

/**
 * Badge.
 *
 * Square, uppercase, wide-tracked — a "Label Caps" chip rather than a pill.
 * Rounded status pills would be the single most out-of-place element in this
 * system.
 */
const badgeVariants = cva(
  'label-caps inline-flex items-center gap-1.5 whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'text-[var(--color-body-warm)]',
        accent: 'text-[var(--color-saffron-deep)]',
        success: 'text-[var(--color-success)]',
        warning: 'text-[var(--color-amber-band)]',
        danger: 'text-[var(--color-error)]',
        info: 'text-[var(--color-terracotta)]',
        solid: 'text-[var(--color-terracotta)]',
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
 * Status colour is centralised so one state never renders two different
 * colours in two different tables — a small inconsistency that badly
 * undermines trust in a financial dashboard.
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
