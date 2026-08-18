#!/usr/bin/env node
/**
 * Checks that every image the code asks for exists, and reports files that
 * nothing asks for.
 *
 * WHY THIS EXISTS — two real faults it would have caught immediately:
 *
 * 1. Fifteen assets were committed as DIRECTORIES (`public/images/moon_sign_icon/
 *    screen.png`). A directory cannot be served as an image, so all fifteen
 *    were unreachable — 15.2MB in the repo rendering nothing at all. Nothing
 *    failed loudly because nothing referenced them yet.
 *
 * 2. `imagery.ts` declared `practitionerPortrait` pointing at
 *    `/images/practitionerPortrait.jpg`, which has never existed. No caller
 *    used the key, so it sat there as a landmine for whoever used it first.
 *
 * Neither shows up in a typecheck or a build, because a string that happens to
 * be a path is just a string.
 *
 * Run: npm run audit:images
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const IMAGES = path.join(PUBLIC, 'images');
const SRC = path.join(ROOT, 'src');

const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;

/** Every file under public/images, as a web path. */
function walk(dir, out = [], dirs = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      dirs.push(abs);
      walk(abs, out, dirs);
    } else {
      out.push(abs);
    }
  }
  return { files: out, dirs };
}

const { files, dirs } = walk(IMAGES);
const onDisk = new Set(files.map((f) => '/' + path.relative(PUBLIC, f).split(path.sep).join('/')));

/** Every /images/… string anywhere in src. */
function sources(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(abs, acc);
    else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) acc.push(abs);
  }
  return acc;
}

const referenced = new Map(); // path -> [files that reference it]
for (const file of sources(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/['"`(](\/images\/[A-Za-z0-9_./-]+)['"`)]/g)) {
    const p = m[1];
    if (!referenced.has(p)) referenced.set(p, []);
    referenced.get(p).push(path.relative(ROOT, file));
  }
}

let failed = 0;

// ---------------------------------------------------------------------------
// 1. Directories that look like they were meant to be images.
// ---------------------------------------------------------------------------
const suspectDirs = dirs.filter((d) =>
  fs.readdirSync(d).some((f) => IMAGE_EXT.test(f) && /^(screen|image|output)\./i.test(f)),
);
if (suspectDirs.length) {
  failed++;
  console.log('\n✗ Asset folders that should be files');
  console.log('  A directory cannot be served as an image. Flatten these.');
  for (const d of suspectDirs) console.log(`    public/${path.relative(PUBLIC, d)}/`);
}

// ---------------------------------------------------------------------------
// 2. Referenced but missing.
// ---------------------------------------------------------------------------
const missing = [...referenced.keys()].filter((p) => !onDisk.has(p));
if (missing.length) {
  failed++;
  console.log('\n✗ Referenced but not on disk');
  for (const p of missing) {
    console.log(`    ${p}`);
    for (const f of [...new Set(referenced.get(p))]) console.log(`        ${f}`);
  }
}

// ---------------------------------------------------------------------------
// 3. On disk but referenced by nothing. Advisory — does not fail.
// ---------------------------------------------------------------------------
const orphans = [...onDisk].filter((p) => !referenced.has(p));
if (orphans.length) {
  const bytes = orphans.reduce(
    (n, p) => n + fs.statSync(path.join(PUBLIC, p.slice(1))).size,
    0,
  );
  console.log(`\n⚠ ${orphans.length} file(s) referenced by nothing (${(bytes / 1048576).toFixed(2)}MB)`);
  for (const p of orphans.slice(0, 40)) console.log(`    ${p}`);
  if (orphans.length > 40) console.log(`    …and ${orphans.length - 40} more`);
  console.log('  Not a failure — some are referenced by filename from the database.');
}

// ---------------------------------------------------------------------------
// 4. Oversized originals.
// ---------------------------------------------------------------------------
const heavy = [...onDisk]
  .map((p) => ({ p, size: fs.statSync(path.join(PUBLIC, p.slice(1))).size }))
  .filter((f) => f.size > 900 * 1024)
  .sort((a, b) => b.size - a.size);
if (heavy.length) {
  console.log(`\n⚠ ${heavy.length} file(s) over 900KB`);
  for (const f of heavy) console.log(`    ${(f.size / 1048576).toFixed(2)}MB  ${f.p}`);
  console.log('  next/image optimises delivery, but these still bloat the repo and the');
  console.log('  cold build. Convert to WebP unless there is a reason not to.');
}

console.log(
  `\n${onDisk.size} files on disk · ${referenced.size} distinct paths referenced from src`,
);

if (failed) {
  process.exit(1);
}
console.log('Every referenced image exists.');
