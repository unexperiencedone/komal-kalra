#!/usr/bin/env node
/**
 * Checks the numerology arithmetic against hand-worked answers.
 *
 * These are the four tools that need no API, so this runs anywhere with no key
 * and no network — which is the point. A calculator that quietly returns the
 * wrong number is worse than one that is down, because nobody reports it.
 *
 * Run: npm run astrology:selftest
 */
import { reduceNumber, nameNumber, coreNumbers, loShuGrid, flames } from '../src/lib/astrology/numerology.ts';

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { console.log(`  ok    ${label}`); return; }
  failed++;
  console.log(`  FAIL  ${label}\n          expected ${e}\n          got      ${a}`);
};

console.log('\nreduceNumber');
check('39 -> 3', reduceNumber(39), 3);
check('29 keeps master 11', reduceNumber(29), 11);
check('29 reduced to 2 when masters off', reduceNumber(29, false), 2);
check('22 stays 22', reduceNumber(22), 22);

console.log('\nnameNumber (Chaldean)');
// K=2 O=7 M=4 A=1 L=3  => 17 -> 8
check('KOMAL totals 17', nameNumber('Komal').total, 17);
check('KOMAL reduces to 8', nameNumber('Komal').reduced, 8);
check('accents ignored', nameNumber('Zoë').total, nameNumber('Zoe').total);

console.log('\ncoreNumbers');
check('1990-03-24 psychic', coreNumbers('1990-03-24')?.psychic, 6);
// 1+9+9+0 + 0+3 + 2+4 = 28 -> 10 -> 1
check('1990-03-24 destiny', coreNumbers('1990-03-24')?.destiny, 1);
check('impossible date rejected', coreNumbers('2024-02-31'), null);
check('malformed rejected', coreNumbers('24-03-1990'), null);

console.log('\nloShuGrid');
check('1990-03-24 missing digits', loShuGrid('1990-03-24')?.missing, [5, 6, 7, 8]);
check('digit 9 appears twice', loShuGrid('1990-03-24')?.counts[9], 2);

console.log('\nflames');
check('identical names cancel to null', flames('Ravi', 'Ravi'), null);
check('deterministic', flames('Komal', 'Arjun'), flames('Komal', 'Arjun'));

console.log(failed ? `\n${failed} check(s) failed.\n` : '\nAll checks passed.\n');
process.exit(failed ? 1 : 0);
