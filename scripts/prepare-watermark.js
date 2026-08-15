#!/usr/bin/env node
/**
 * Prepares the Rashi Chakra watermark for use as a page decoration.
 *
 * THE PROBLEM THIS SOLVES
 * public/images/watermark.png has NO alpha channel. What looks like
 * transparency is the editor's checkerboard rendered into the pixels — a
 * white/grey grid. Dropped onto the page as-is it renders a grey checkered
 * square, not a floating wheel.
 *
 * THE KEY
 * The background is strictly greyscale (r == g == b) and bright; the brass is
 * strongly warm (r > g > b, e.g. 166,141,100). So a pixel is background when it
 * is BOTH near-neutral AND bright:
 *
 *     saturation = max(r,g,b) - min(r,g,b) < SAT_MAX
 *     brightness = max(r,g,b)             > VAL_MIN
 *
 * Using saturation rather than a flat brightness cut is what preserves the
 * brass specular highlights, which are bright but never neutral.
 *
 * Run: npm run watermark:prepare
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'public', 'images', 'watermark.png');
const OUT = path.join(__dirname, '..', 'public', 'images', 'watermark-mark.webp');

/** Below this chroma a pixel counts as neutral (background or checkerboard). */
const SAT_MAX = 14;
/** Above this luminance a neutral pixel is background rather than engraving. */
const VAL_MIN = 185;
/** Feather width, so the cut edge is not aliased. */
const FEATHER = 10;

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`Not found: ${SRC}`);
    process.exit(1);
  }

  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let cleared = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;

    if (sat < SAT_MAX && max > VAL_MIN) {
      data[i + 3] = 0;
      cleared++;
    } else if (sat < SAT_MAX + FEATHER && max > VAL_MIN - FEATHER) {
      // Feather band: ramp alpha instead of a hard edge.
      const t = Math.min(1, (SAT_MAX + FEATHER - sat) / FEATHER);
      data[i + 3] = Math.round(255 * (1 - t));
    }
  }

  const total = width * height;
  await sharp(data, { raw: { width, height, channels } })
    .webp({ quality: 86, alphaQuality: 95 })
    .toFile(OUT);

  const size = fs.statSync(OUT).size;
  console.log(`source      ${width}×${height}  ${(fs.statSync(SRC).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`cleared     ${((cleared / total) * 100).toFixed(1)}% of pixels to transparent`);
  console.log(`written     ${path.relative(process.cwd(), OUT)}  ${(size / 1024).toFixed(0)} KB`);
})();
