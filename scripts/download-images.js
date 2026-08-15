#!/usr/bin/env node
/**
 * Downloads every brand photograph referenced in src/lib/content/imagery.ts
 * into public/images, then tells you to flip USE_LOCAL_IMAGES to true.
 *
 * Run:  npm run images:download
 *
 * Written as a script you run rather than something done for you because the
 * Stitch URLs are ~300 characters and exceed the length limit of the fetch
 * tooling available during the build.
 */
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const SRC = path.join(__dirname, '..', 'src', 'lib', 'content', 'imagery.ts');
const OUT = path.join(__dirname, '..', 'public', 'images');

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
    https.get(url, (res) => {
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
    }).on('error', reject);
  });
}

(async () => {
  let ok = 0, failed = 0;
  for (const { key, remote, local } of entries) {
    const dest = path.join(OUT, path.basename(local));
    try {
      const buf = await get(remote);
      fs.writeFileSync(dest, buf);
      console.log(`  ok    ${key}  ${(buf.length / 1024).toFixed(0)} KB`);
      ok++;
    } catch (err) {
      console.error(`  FAIL  ${key}  ${err.message}`);
      failed++;
    }
  }
  console.log(`\n${ok} downloaded, ${failed} failed → public/images`);
  if (ok && !failed) {
    console.log('Now set USE_LOCAL_IMAGES = true in src/lib/content/imagery.ts');
  }
  if (failed) {
    console.log('Some URLs have expired. Re-export from Stitch, or save them by hand.');
    process.exit(1);
  }
})();
