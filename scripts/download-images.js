#!/usr/bin/env node
/**
 * Downloads every brand photograph referenced in src/lib/content/imagery.ts
 * into public/images, at the HIGHEST resolution the CDN will serve.
 *
 * Run:  npm run images:download
 *
 * WHY THE SIZE LADDER
 *
 * The first version of this script fetched the bare URL and got 512px
 * thumbnails — far too small for a hero rendered at 100vw, where a retina
 * 1440px viewport needs roughly 2880px.
 *
 * Google's image CDN takes a size suffix appended to the path:
 *   =s0      original, unsampled  ← what we want
 *   =w2560   scaled to 2560 wide
 *   (none)   whatever the default thumbnail is
 *
 * So we try each in turn and keep the first that returns a genuinely larger
 * image than the bare URL. Real pixels from the source always beat pixels
 * invented by an upscaler, so this runs before any upscaling is considered.
 */
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const SRC = path.join(__dirname, '..', 'src', 'lib', 'content', 'imagery.ts');
const OUT = path.join(__dirname, '..', 'public', 'images');

/** Tried in order; the first that beats the bare URL by >20% in bytes wins. */
const SIZE_SUFFIXES = ['=s0', '=w2560', '=w2048', ''];

const source = fs.readFileSync(SRC, 'utf8');
const entries = [...source.matchAll(/(\w+):\s*\{\s*remote:\s*'([^']+)',\s*local:\s*'([^']+)'/g)]
  .map(([, key, remote, local]) => ({ key, remote, local }));

if (!entries.length) {
  console.error('No images found in imagery.ts — has its shape changed?');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'));
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(get(res.headers.location, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

/** Reads intrinsic dimensions from JPEG/PNG/WebP headers — no dependency. */
function dimensions(buf) {
  // PNG
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // WebP (VP8X / VP8L / VP8)
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8X') return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  // JPEG — walk the segment markers to the SOF
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

(async () => {
  let ok = 0, failed = 0;
  const report = [];

  for (const { key, remote, local } of entries) {
    const dest = path.join(OUT, path.basename(local));

    let best = null;
    let bestSuffix = null;

    for (const suffix of SIZE_SUFFIXES) {
      try {
        const buf = await get(remote + suffix);
        const dim = dimensions(buf);
        if (!best || buf.length > best.length * 1.2) {
          best = buf;
          bestSuffix = suffix || '(bare)';
          // =s0 is the original — nothing larger exists, so stop.
          if (suffix === '=s0' && dim && dim.w > 1024) break;
        }
      } catch {
        // This suffix is not accepted for this asset; try the next.
      }
    }

    if (!best) {
      console.error(`  FAIL  ${key}`);
      failed++;
      continue;
    }

    fs.writeFileSync(dest, best);
    const dim = dimensions(best);
    report.push({ key, suffix: bestSuffix, dim, kb: Math.round(best.length / 1024) });
    ok++;
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n${pad('image', 30)}${pad('served by', 11)}${pad('dimensions', 14)}size`);
  console.log('-'.repeat(62));
  for (const r of report) {
    console.log(
      pad(r.key, 30) + pad(r.suffix, 11) +
      pad(r.dim ? `${r.dim.w} x ${r.dim.h}` : '?', 14) + `${r.kb} KB`,
    );
  }

  const small = report.filter((r) => r.dim && r.dim.w < 1600);
  console.log(`\n${ok} downloaded, ${failed} failed → public/images`);

  if (small.length) {
    console.log(
      `\n${small.length} image(s) are still under 1600px wide. The CDN has no larger\n` +
      `original, so these are the candidates for AI upscaling — see docs/architecture.md §17.`,
    );
  }
  if (failed) process.exit(1);
})();
