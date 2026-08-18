import type { Block, LegalDocument as Doc } from '@/lib/content/legal';
import { LEGAL_LAST_UPDATED } from '@/lib/content/legal';

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'p':
      return (
        <p
          key={i}
          className="mt-4 max-w-[var(--measure-wide)] text-[15px] leading-[1.7] text-[var(--color-body-warm)]"
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
              className="flex gap-3 text-[15px] leading-[1.7] text-[var(--color-body-warm)]"
            >
              <span aria-hidden className="mt-[0.7em] size-1 shrink-0 bg-[var(--color-saffron)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'definitions':
      return (
        <dl key={i} className="mt-6 max-w-[var(--measure-wide)] border-t border-[var(--color-hairline)]">
          {block.items.map((item) => (
            <div key={item.term} className="border-b border-[var(--color-hairline)] py-5">
              <dt className="text-[15px] font-medium text-[var(--color-cocoa)]">{item.term}</dt>
              <dd className="mt-1.5 text-[15px] leading-[1.7] text-[var(--color-body-warm)]">
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
      <p className="label-caps text-[var(--color-saffron-deep)]">Legal</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[length:var(--text-h1)] text-[var(--color-cocoa)]">{doc.title}</h1>
      <span className="gold-rule mt-6" aria-hidden />

      <p className="standfirst mt-6 text-[var(--color-body-warm)]">{doc.standfirst}</p>

      <p className="label-small mt-6 text-[var(--color-body-warm)] opacity-80">
        Last updated: {LEGAL_LAST_UPDATED}
      </p>

      {doc.sections.length > 0 && (
        <div className="mt-10 max-w-[var(--measure-wide)] bg-[var(--color-card-cream)] border border-[var(--color-hairline)] p-8 relative before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10">
          <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)] relative z-20">Sections</h3>
          <ul className="mt-4 space-y-2 relative z-20">
            {doc.sections.map((section, idx) => (
              <li key={section.heading}>
                <a 
                  href={`#section-${idx + 1}`}
                  className="text-sm font-medium text-[var(--color-terracotta)] hover:text-[var(--color-cocoa)] transition-colors"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-14 space-y-12">
        {doc.sections.map((section, idx) => (
          <section key={section.heading} id={`section-${idx + 1}`} className="scroll-mt-24">
            <p className="label-caps text-[var(--color-saffron-deep)]">Section {idx + 1}</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[length:var(--text-h3)] font-semibold text-[var(--color-cocoa)] uppercase">
              {section.heading}
            </h2>
            {section.blocks.map(renderBlock)}
          </section>
        ))}
      </div>
    </article>
  );
}
