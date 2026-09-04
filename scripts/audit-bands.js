#!/usr/bin/env node
/**
 * Fails when two adjacent full-bleed sections share a background tone.
 *
 * WHY THIS EXISTS
 *
 * The homepage shipped with five consecutive cream sections. Nothing was
 * broken in any individual file — each section looked distinct in its own JSX,
 * because `.band-cream`, `.band-low`, `.band-ivory` and
 * `bg-[var(--color-cream)]` are four ways of writing the same colour. The
 * problem only exists between files, which is why review missed it and why it
 * needs a checker rather than a rule.
 *
 * It also caught the worse case: a terracotta closing CTA immediately above a
 * terracotta footer, with no boundary between the page and the footer at all.
 *
 * HOW IT WORKS
 *
 * Walks the marketing page files in source order, pulls the tone out of each
 * top-level section, and reports any two in a row that match. This is textual
 * and therefore approximate — it reads the tone classes it knows about and
 * ignores sections it cannot classify rather than guessing. A miss is possible;
 * a false alarm is not, which is the right way round for something wired into
 * a build.
 *
 * Run: npm run audit:bands
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

/** Every way a tone can currently be written, mapped to the colour it is. */
const TONE_PATTERNS = [
  [/\bband-cream\b/, 'cream'],
  [/bg-\[var\(--color-cream\)\]/, 'cream'],
  [/\bband-sand\b/, 'sand'],
  [/\bband-card-cream\b/, 'sand'],
  [/\bband-low\b/, 'sand'],
  [/\bband-ivory\b/, 'sand'],
  [/bg-\[var\(--color-card-cream\)\]/, 'sand'],
  [/\bband-terracotta\b/, 'terracotta'],
  [/bg-\[var\(--color-terracotta\)\]/, 'terracotta'],
  [/\bband-amber\b/, 'amber'],
  [/\bband-maroon\b/, 'maroon'],
  [/\bband-navy\b/, 'maroon'],
  [/tone="(cream|sand|terracotta|amber|maroon)"/, null], // captured below
];

function toneOf(openingTag) {
  const bandProp = openingTag.match(/tone=["'](cream|sand|terracotta|amber|maroon)["']/);
  if (bandProp) return bandProp[1];
  for (const [re, tone] of TONE_PATTERNS) {
    if (tone && re.test(openingTag)) return tone;
  }
  return null;
}

/**
 * Resolve a component reference to the tone of its own root section, so a page
 * composed of <IconStrip /> and <Differentiators /> can still be checked.
 */
const componentToneCache = new Map();
function componentTone(name) {
  if (componentToneCache.has(name)) return componentToneCache.get(name);
  const file = path.join(ROOT, 'src', 'components', 'marketing', `${name}.tsx`);
  let tone = null;
  if (fs.existsSync(file)) {
    const src = fs.readFileSync(file, 'utf8');
    const tag = src.match(/<(?:section|Band)\b[\s\S]{0,600}?>/);
    if (tag) tone = toneOf(tag[0]);

    /*
     * A component that forwards a prop renders `<Band tone={tone}>`, which is a
     * JSX expression and matches no colour literal — so the line above returns
     * null and the section becomes invisible to this check. Fall back to the
     * DEFAULT declared in its signature (`tone = 'sand'`), which is what
     * actually renders when the call site says nothing.
     *
     * This mattered: <BeejMantras tone="cream" /> sits between two sand bands
     * and was being skipped entirely, so the audit reported those two sand
     * neighbours as adjacent when a cream band was in fact between them.
     */
    if (!tone) {
      const def = src.match(/\btone\s*(?::[^=]*)?=\s*['"](cream|sand|terracotta|amber|maroon)['"]/);
      if (def) tone = def[1];
    }
  }
  componentToneCache.set(name, tone);
  return tone;
}

function bandsIn(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  // Top-level <section …>, <Band …>, and self-closing marketing components.
  // Self-closing components must allow props — `<Testimonials items={x} />`
  // was being skipped when this only matched `<Name />`, which hid a clash.
  const re = /<(section|Band)\b([\s\S]{0,700}?)>|<([A-Z][A-Za-z0-9]*)[^>]*?\/>/g;
  let m;
  while ((m = re.exec(src))) {
    const line = src.slice(0, m.index).split('\n').length;
    if (m[3]) {
      // An explicit tone at the CALL SITE wins over the component's default.
      // `<BeejMantras tone="cream" />` renders cream whatever the component
      // falls back to, and the same component is deliberately used at two
      // different tones on different pages.
      const tone = toneOf(m[0]) || componentTone(m[3]);
      if (tone) out.push({ line, tone, label: `<${m[3]} />` });
    } else {
      const tone = toneOf(m[0]);
      if (tone) out.push({ line, tone, label: `<${m[1]}>` });
    }
  }
  return out;
}

const PAGES = [
  'src/app/(marketing)/page.tsx',
  'src/app/(marketing)/services/page.tsx',
  'src/app/(marketing)/services/[slug]/page.tsx',
  'src/app/(marketing)/about/page.tsx',
  'src/app/(marketing)/contact/page.tsx',
  'src/app/(marketing)/faq/page.tsx',
  'src/app/(marketing)/free-tools/page.tsx',
  'src/app/(marketing)/free-kundli/page.tsx',
  'src/app/(marketing)/kundli-matching/page.tsx',
].filter((p) => fs.existsSync(path.join(ROOT, p)));

let problems = 0;
let checked = 0;

for (const rel of PAGES) {
  const bands = bandsIn(path.join(ROOT, rel));
  checked += bands.length;
  const clashes = [];
  for (let i = 1; i < bands.length; i++) {
    if (bands[i].tone === bands[i - 1].tone) clashes.push([bands[i - 1], bands[i]]);
  }

  const seq = bands.map((b) => b.tone).join(' → ') || '(none detected)';
  if (clashes.length) {
    problems += clashes.length;
    console.log(`\n✗ ${rel}`);
    console.log(`   ${seq}`);
    for (const [a, b] of clashes) {
      console.log(`   line ${a.line} ${a.label} and line ${b.line} ${b.label} are both "${a.tone}"`);
    }
  } else {
    console.log(`✓ ${rel.replace('src/app/(marketing)/', '')}  ${seq}`);
  }
}

console.log(`\n${checked} bands across ${PAGES.length} pages.`);

if (problems) {
  console.log(
    `\n${problems} adjacent same-tone pair(s). Two sections of the same colour with\n` +
      `nothing between them read as one section — give one of them a different\n` +
      `tone, or pass ruled to draw a hairline if they genuinely must match.`,
  );
  process.exit(1);
}
console.log('No adjacent bands share a tone.');
