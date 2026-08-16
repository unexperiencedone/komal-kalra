#!/usr/bin/env node
/**
 * Writes docs/legal/*.md from src/lib/content/legal.ts.
 *
 * WHY THIS EXISTS
 * The legal text has to live in two places — rendered on the site, and as
 * markdown for the record. Maintaining both by hand guarantees they diverge the
 * first time a clause changes, and two versions of a privacy policy that
 * disagree is worse than having only one. So the TypeScript module is the
 * single source of truth and this derives the markdown from it.
 *
 * HOW IT READS THE SOURCE
 * It TRANSPILES the module with the TypeScript compiler and evaluates it,
 * rather than pattern-matching the file as text. An earlier version used
 * regexes and broke on the first nested structure it met — which is the
 * expected outcome, because a regex cannot parse a language. Transpiling means
 * this keeps working whatever shape the content takes, as long as the exports
 * stay the same.
 *
 * Run: npm run legal:export
 */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'legal');

let ts;
try {
  ts = require(path.join(ROOT, 'node_modules', 'typescript'));
} catch {
  try {
    ts = require('typescript');
  } catch {
    console.error('TypeScript not found. Run `npm install` first.');
    process.exit(1);
  }
}

/**
 * Compiles a .ts file to CommonJS and evaluates it, resolving the project's
 * `@/` path alias against src/.
 */
function loadTs(absPath, cache = new Map()) {
  if (cache.has(absPath)) return cache.get(absPath);

  const source = fs.readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const mod = new Module(absPath, null);
  mod.filename = absPath;
  mod.paths = Module._nodeModulePaths(path.dirname(absPath));

  // Resolve `@/…` to src/…, and let anything else fall through to Node.
  const realRequire = mod.require.bind(mod);
  mod.require = (request) => {
    if (request.startsWith('@/')) {
      const target = path.join(ROOT, 'src', request.slice(2));
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        if (fs.existsSync(target + ext)) return loadTs(target + ext, cache);
      }
      if (fs.existsSync(target)) return loadTs(target, cache);
      throw new Error(`Cannot resolve ${request}`);
    }
    return realRequire(request);
  };

  cache.set(absPath, mod.exports);
  mod._compile(outputText, absPath);
  cache.set(absPath, mod.exports);
  return mod.exports;
}

const legal = loadTs(path.join(ROOT, 'src', 'lib', 'content', 'legal.ts'));
const { LEGAL_INDEX, LEGAL_LAST_UPDATED } = legal;

if (!Array.isArray(LEGAL_INDEX) || !LEGAL_INDEX.length) {
  console.error('LEGAL_INDEX is empty — has legal.ts changed its exports?');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

function renderBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.type === 'p') out.push(b.text, '');
    if (b.type === 'list') {
      for (const item of b.items) out.push(`- ${item}`);
      out.push('');
    }
    if (b.type === 'definitions') {
      for (const d of b.items) out.push(`**${d.term}**`, '', d.text, '');
    }
  }
  return out;
}

const index = [];

for (const doc of LEGAL_INDEX) {
  const lines = [
    `# ${doc.title}`,
    '',
    `> **Last updated:** ${LEGAL_LAST_UPDATED}  `,
    `> **Published at:** \`/legal/${doc.slug}\`  `,
    '>',
    '> ⚠️ **Generated file.** Written from `src/lib/content/legal.ts` by',
    '> `npm run legal:export`. Edit the TypeScript source, not this file.',
    '>',
    '> Not reviewed by a lawyer. See `docs/legal-compliance.md` for what these',
    '> documents are intended to satisfy and what still needs professional review.',
    '',
    doc.standfirst,
    '',
    '---',
    '',
  ];

  for (const section of doc.sections) {
    lines.push(`## ${section.heading}`, '');
    lines.push(...renderBlocks(section.blocks));
  }

  const file = path.join(OUT, `${doc.slug}.md`);
  fs.writeFileSync(file, `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`);

  const words = JSON.stringify(doc).split(/\s+/).length;
  console.log(`  ${doc.slug.padEnd(10)} ${String(doc.sections.length).padStart(2)} sections  ~${words} words  →  docs/legal/${doc.slug}.md`);
  index.push(doc);
}

// A README so the folder explains itself.
fs.writeFileSync(
  path.join(OUT, 'README.md'),
  [
    '# Legal documents',
    '',
    '⚠️ **These files are generated.** Edit `src/lib/content/legal.ts` and run',
    '`npm run legal:export`. Editing the markdown directly will be overwritten.',
    '',
    `Last generated from source dated **${LEGAL_LAST_UPDATED}**.`,
    '',
    '| Document | Live URL | Required by |',
    '|---|---|---|',
    ...index.map((d) => {
      const why = {
        terms: 'Razorpay activation · Google OAuth consent screen',
        privacy: 'DPDP Act 2023 · Razorpay activation · Google OAuth consent screen',
        refunds: 'Razorpay activation',
        delivery: 'Razorpay activation (shipping/delivery policy check)',
      }[d.slug];
      return `| [${d.title}](./${d.slug}.md) | \`/legal/${d.slug}\` | ${why} |`;
    }),
    '',
    'See [`../legal-compliance.md`](../legal-compliance.md) for the obligations',
    'these are written against and what still needs a lawyer.',
    '',
  ].join('\n'),
);

console.log(`\n${index.length} documents exported to docs/legal/`);
