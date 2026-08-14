/**
 * Money.
 *
 * INVARIANT: every monetary value in this codebase — in the database, in API
 * payloads, in React props — is an integer number of paise. Rupee floats do not
 * exist. Razorpay is paise-native, and floating-point rupees eventually produce
 * a rounding bug in the one part of the system where being wrong costs money.
 *
 * This module is the ONLY place paise become a human-readable string.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const INR_PRECISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `210000` → `"₹2,100"`. Whole rupees; used everywhere prices are displayed. */
export function formatPaise(paise: number): string {
  return INR.format(Math.round(paise) / 100);
}

/** `210050` → `"₹2,100.50"`. Used on receipts and in the payments table. */
export function formatPaisePrecise(paise: number): string {
  return INR_PRECISE.format(Math.round(paise) / 100);
}

/** Compact form for dashboard tiles: `4500000` → `"₹45.0K"`. */
export function formatPaiseCompact(paise: number): string {
  const rupees = Math.round(paise) / 100;
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return INR.format(rupees);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Tax in basis points, floored to whole paise.
 * Floor rather than round, so the total can never exceed what we quoted.
 */
export function taxOn(netPaise: number, bps: number): number {
  if (bps <= 0) return 0;
  return Math.floor((netPaise * bps) / 10_000);
}
