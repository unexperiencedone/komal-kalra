/**
 * Vedic numerology. Pure arithmetic — no network, no API key, no cost.
 *
 * This module is deliberately dependency-free and deterministic: the same
 * inputs give the same answer forever. That is why the numerology tools were
 * built before the Prokerala integration — they cannot rate-limit, cannot fail
 * when a vendor has an outage, and cannot burn a credit budget.
 *
 * WHAT IS AND IS NOT STANDARD HERE
 *
 * Numerology has several competing conventions and no authority to settle
 * them. Where a choice exists, this file makes the common Indian one and says
 * so, rather than presenting one school's answer as the answer:
 *
 *   • Master numbers 11, 22 and 33 are NOT reduced. Western numerology mostly
 *     preserves them; some Indian schools reduce everything to 1–9. Preserved
 *     here because the tool is labelled Vedic-adjacent and readers expect it.
 *   • Name numbers use the CHALDEAN table, not Pythagorean. Chaldean is the
 *     older system and the one Indian numerology overwhelmingly uses. It
 *     assigns 1–8 only — there is no 9, which was considered sacred.
 *   • The Lo Shu grid counts digits of the full date of birth, including the
 *     century. Some schools use a two-digit year; that produces different
 *     grids for 1970 and 2070 in a way the digit-count method does not.
 */

/**
 * Reduce to a single digit, preserving master numbers.
 *
 * Iterative rather than recursive so the master-number stop condition is
 * checked between every pass — a recursive version that checks only on entry
 * happily reduces 29 → 11 → 2 and loses the master number.
 */
export function reduceNumber(value: number, keepMasters = true): number {
  let current = Math.abs(Math.trunc(value));
  const isMaster = (n: number) => keepMasters && (n === 11 || n === 22 || n === 33);

  while (current > 9 && !isMaster(current)) {
    current = String(current)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

/** Chaldean letter values. Note there is no 9 — that is correct, not a gap. */
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Pythagorean, offered for comparison on the name-number tool. */
const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

/**
 * Strips accents before matching, so "Zoë" and "Zoe" agree. Without this the
 * accented character simply scores 0 and the name silently comes out wrong —
 * a failure the user has no way to notice.
 */
function letters(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split('')
    .filter((char) => char >= 'A' && char <= 'Z');
}

export function nameNumber(name: string, system: 'chaldean' | 'pythagorean' = 'chaldean') {
  const table = system === 'chaldean' ? CHALDEAN : PYTHAGOREAN;
  const total = letters(name).reduce((sum, char) => sum + (table[char] ?? 0), 0);
  return { total, reduced: reduceNumber(total) };
}

export interface CoreNumbers {
  /** Day of birth reduced. Also called Mulank or the birth number. */
  psychic: number;
  /** Whole date reduced. Also called Bhagyank or the life-path number. */
  destiny: number;
  /** Chaldean value of the name. */
  name: number | null;
  /** The year alone, reduced — the "personal year" tools use this. */
  yearNumber: number;
}

/** `dob` is an ISO date, `YYYY-MM-DD`. */
export function coreNumbers(dob: string, fullName?: string): CoreNumbers | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;

  const [, year, month, day] = match;
  // Validate rather than trust: '2024-02-31' matches the pattern and would
  // otherwise produce a confident answer for a date that does not exist.
  const parsed = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== Number(day)) return null;

  const digits = (s: string) => s.split('').reduce((sum, d) => sum + Number(d), 0);

  return {
    psychic: reduceNumber(Number(day)),
    destiny: reduceNumber(digits(year) + digits(month) + digits(day)),
    name: fullName?.trim() ? nameNumber(fullName).reduced : null,
    yearNumber: reduceNumber(digits(year)),
  };
}

/**
 * Lo Shu grid — a 3×3 magic square counting how often each digit 1–9 appears
 * in the full date of birth. Zeroes are ignored; they have no cell.
 *
 * Returned as counts per digit plus the grid rows in visual order, so the UI
 * does not have to know the square's layout:
 *
 *     4 9 2
 *     3 5 7
 *     8 1 6
 */
export const LO_SHU_LAYOUT: readonly (readonly number[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

export function loShuGrid(dob: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const char of dob.replace(/-/g, '')) {
    const digit = Number(char);
    if (digit >= 1 && digit <= 9) counts[digit] += 1;
  }

  return {
    counts,
    rows: LO_SHU_LAYOUT.map((row) => row.map((digit) => ({ digit, count: counts[digit] }))),
    missing: Object.entries(counts)
      .filter(([, count]) => count === 0)
      .map(([digit]) => Number(digit)),
  };
}

/**
 * FLAMES — a playground game, not astrology, and labelled as such wherever it
 * is shown. Included because people look for it, not because it means
 * anything.
 *
 * The classic elimination: strike out letters common to both names, count what
 * remains, then count round F-L-A-M-E-S removing one each pass.
 */
const FLAMES_RESULTS = ['Friends', 'Love', 'Affection', 'Marriage', 'Enemy', 'Siblings'] as const;

export function flames(a: string, b: string): (typeof FLAMES_RESULTS)[number] | null {
  const left = letters(a);
  const right = letters(b);
  if (!left.length || !right.length) return null;

  // Cancel each shared letter ONCE per occurrence, not all occurrences — the
  // game removes matched pairs, so "anna"/"ana" leaves one 'n' behind.
  const remaining = [...right];
  let count = 0;
  for (const char of left) {
    const at = remaining.indexOf(char);
    if (at === -1) count += 1;
    else remaining.splice(at, 1);
  }
  count += remaining.length;

  if (count === 0) return null;

  const pool: string[] = [...FLAMES_RESULTS];
  let index = 0;
  while (pool.length > 1) {
    index = (index + count - 1) % pool.length;
    pool.splice(index, 1);
  }
  return pool[0] as (typeof FLAMES_RESULTS)[number];
}
