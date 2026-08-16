import type { Block, LegalDocument as Doc } from '@/lib/content/legal';
import { LEGAL_LAST_UPDATED } from '@/lib/content/legal';

/**
 * Renders a legal document from the structured content in lib/content/legal.ts.
 *
 * One renderer for all four documents so they are typographically identical —
 * inconsistent legal pages read as careless, which is precisely the opposite of
 * what they are for.
 *
 * Long-form reference copy uses `--measure-wide` (~78ch) rather than the
 * standard 68ch: these are documents people scan for a specific clause rather
 * than read linearly, and a slightly longer line suits that.
 */
function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'p':
      return (
        <p
          key={i}
          className="mt-4 max-w-[var(--measure-wide)] text-[15px] leading-[1.7] text-[var(--color-on-surface-variant)]"
        >
          {block.text}
        </p>
      );

    case 'list':
      return (
        <ul key={i} className="mt-4 max-w-[var(--measure-wide)] space-y-2.5">
          {block.items.map((item) => (
            <li
              key={item.slice(0, 30)}
              className="flex gap-3 text-[15px] leading-[1.7] text-[var(--color-on-surface-variant)]"
            >
              <span aria-hidden className="mt-[0.7em] size-1 shrink-0 bg-[var(--color-muted-gold)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    // Term + explanation pairs, set as a real <dl>. Used for the "what we
    // collect and why" and "who processes your data" tables, where the pairing
    // is the point and a flat list would lose it.
    case 'definitions':
      return (
        <dl key={i} className="mt-6 max-w-[var(--measure-wide)] border-t border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)]">
          {block.items.map((item) => (
            <div key={item.term} className="border-b border-[color-mix(in_srgb,var(--color-muted-gold)_20%,transparent)] py-5">
              <dt className="text-[15px] font-medium text-[var(--color-cosmic-navy)]">{item.term}</dt>
              <dd className="mt-1.5 text-[15px] leading-[1.7] text-[var(--color-on-surface-variant)]">
                {item.text}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

export function LegalDocumentView({ doc }: { doc: Doc }) {
  return (
    <article>
      <p className="label-caps text-[var(--color-gold-deep)]">Legal</p>
      <h1 className="mt-4 text-[length:var(--text-h1)]">{doc.title}</h1>
      <span className="gold-rule mt-6" aria-hidden />

      <p className="standfirst mt-6">{doc.standfirst}</p>

      <p className="label-small mt-6 text-[var(--color-on-surface-variant)]">
        Last updated: {LEGAL_LAST_UPDATED}
      </p>

      <div className="mt-14 space-y-12">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-h3)] font-semibold text-[var(--color-cosmic-navy)]">
              {section.heading}
            </h2>
            {section.blocks.map(renderBlock)}
          </section>
        ))}
      </div>
    </article>
  );
}
