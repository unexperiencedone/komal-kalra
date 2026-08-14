'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { formatPaisePrecise, paiseToRupees } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/states';

/**
 * Refund control.
 *
 * Three guards, because this is the only button in the product that moves money
 * out of the business:
 *   1. A reason is required — it goes into admin_logs and is what makes the
 *      audit trail useful six months later.
 *   2. The amount is validated against what is actually left to refund, both
 *      here for immediate feedback and again on the server, which is the check
 *      that counts.
 *   3. The button disables itself on submit; the server additionally sends an
 *      idempotency key derived from (payment, amount), so a double click cannot
 *      issue two refunds even if this UI fails.
 */
export function RefundDialog({
  paymentId, amountPaise, refundedPaise, clientName,
}: {
  paymentId: string;
  amountPaise: number;
  refundedPaise: number;
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = amountPaise - refundedPaise;

  async function submit() {
    setError(null);

    if (reason.trim().length < 3) {
      setError('Please give a reason — it is recorded in the audit log.');
      return;
    }

    const rupees = partial ? Number(amount) : undefined;
    if (partial) {
      if (!rupees || rupees <= 0) { setError('Enter an amount to refund.'); return; }
      if (rupees > paiseToRupees(remaining)) {
        setError(`Only ${formatPaisePrecise(remaining)} is left to refund on this payment.`);
        return;
      }
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amountRupees: rupees, reason: reason.trim() }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        setError(json.message ?? 'The refund could not be processed.');
        return;
      }

      toast.success(json.data.message);
      setOpen(false);
      setReason('');
      setAmount('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Nothing has been refunded.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="text-[var(--color-clay)]">
        <Undo2 aria-hidden /> Refund
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Issue a refund"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40 p-4"
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-linen)] bg-white p-6 shadow-[var(--shadow-overlay)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Issue a refund</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-bark)]">
          Refunding {clientName}. {formatPaisePrecise(remaining)} is available to refund
          {refundedPaise > 0 && ` (${formatPaisePrecise(refundedPaise)} already refunded)`}.
        </p>

        <div className="mt-5 space-y-4 text-left">
          {error && <InlineAlert tone="danger">{error}</InlineAlert>}

          <div className="flex gap-2">
            <Button size="sm" variant={partial ? 'outline' : 'primary'} onClick={() => setPartial(false)}>
              Full refund
            </Button>
            <Button size="sm" variant={partial ? 'primary' : 'outline'} onClick={() => setPartial(true)}>
              Partial refund
            </Button>
          </div>

          {partial && (
            <Field label="Amount to refund (₹)" htmlFor="refund-amount" required>
              <Input
                id="refund-amount"
                type="number"
                inputMode="decimal"
                min={1}
                max={paiseToRupees(remaining)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(paiseToRupees(remaining))}
              />
            </Field>
          )}

          <Field
            label="Reason"
            htmlFor="refund-reason"
            required
            hint="Recorded in the audit log against your account."
          >
            <Textarea
              id="refund-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client cancelled within the free window"
            />
          </Field>

          <InlineAlert tone="warning">
            This sends the refund to the payment provider immediately and cannot be undone.
            It settles to the client&apos;s original payment method in 5–7 working days.
          </InlineAlert>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} loading={busy} loadingText="Processing…">
            {partial && amount ? `Refund ₹${amount}` : `Refund ${formatPaisePrecise(remaining)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
