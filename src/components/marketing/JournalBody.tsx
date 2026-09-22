import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { JournalBlock, JournalSection } from '@/lib/content/journal';
import { Reveal } from '@/components/common/Reveal';

/**
 * Renders a post's typed block tree.
 *
 * WHY THE PROSE IS NOT WRAPPED PER BLOCK
 *
 * `.prose-editorial` in globals.css sets its spacing with direct-child
 * selectors — `> * + *`, `> h2 + *`, `> :first-child`. That is deliberate (see
 * the note above it), and it means every paragraph, list and heading has to be
 * a DIRECT child of the `.prose-editorial` element. Wrapping each block in its
 * own `<div>` for convenience hides all of them from those selectors and the
 * article collapses into the flat undifferentiated wall the class was written
 * to fix. So sections render into one prose container and blocks emit bare
 * elements into it.
 *
 * The two blocks that are not prose — `callout` and `tool` — stay inside the
 * measure but carry their own frame and their own vertical margins, because
 * their job is to interrupt the reading rather than to be read in sequence.
 * Those margins override `.prose-editorial`'s own spacing on layer order
 * alone: `.prose-editorial` lives in `@layer components` and every Tailwind
 * utility lives in `@layer utilities`, which resolves later regardless of
 * specificity. That is also why the `steps` heading below can take a plain
 * `mt-2` and not lose to `.prose-editorial h3 { margin-top: 2em }`.
 */

function Block({ block }: { block: JournalBlock }) {
  switch (block.kind) {
    case 'p':
      return <p>{block.text}</p>;

    case 'list':
      return (
        <ul className="space-y-3 pl-0">
          {block.items.map((item) => (
            <li key={item} className="relative pl-6 leading-[1.7]">
              <span
                aria-hidden
                className="absolute left-0 top-[0.68em] size-1.5 bg-[var(--color-saffron)]"
              />
              {item}
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className="space-y-6 pl-0">
          {block.items.map((item, i) => (
            <li
              key={item.title}
              className="relative border-l-2 border-[var(--color-hairline)] pl-6"
            >
              <span className="label-small text-[var(--color-saffron-deep)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-[var(--color-cocoa)]">
                {item.title}
              </h3>
              <p className="mt-2 leading-[1.7]">{item.text}</p>
            </li>
          ))}
        </ol>
      );

    case 'callout':
      return (
        <aside className="relative my-10 border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 before:pointer-events-none before:absolute before:inset-[4px] before:z-10 before:border before:border-[var(--color-hairline)] md:p-8">
          <div className="relative z-20">
            <p className="label-caps text-[var(--color-saffron-deep)]">{block.title}</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-xl leading-[1.45] text-[var(--color-cocoa)] md:text-2xl">
              {block.text}
            </p>
          </div>
        </aside>
      );

    case 'tool':
      /*
        The article's actual conversion path — see the note on the `tool` block
        in journal.ts. It is a Link to a free calculator, styled as an offer
        rather than as a citation, because a reader mid-paragraph will not
        click something that looks like a footnote.
      */
      return (
        <div className="my-8">
          <Link
            href={`/free-tools/${block.slug}`}
            className="group flex flex-col gap-1 border border-[var(--color-hairline)] bg-[var(--color-cream)] p-6 transition-colors duration-300 hover:bg-white"
          >
            <span className="label-caps text-[var(--color-saffron-deep)]">Free tool</span>
            <span className="mt-2 flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-cocoa)] transition-colors group-hover:text-[var(--color-terracotta)]">
              {block.label}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </span>
            <span className="mt-2 text-[15px] leading-[1.7] text-[var(--color-body-warm)]">
              {block.text}
            </span>
          </Link>
        </div>
      );
  }
}

export function JournalBody({ sections }: { sections: JournalSection[] }) {
  return (
    <div className="space-y-14">
      {sections.map((section, i) => (
        <Reveal key={section.id} as="section" delay={i === 0 ? 0 : 80}>
          {/*
            `scroll-mt` so the in-article contents list does not drop the
            heading under the sticky header when it jumps to an anchor. The
            header is two rows on desktop; --header-h covers the mobile case
            and the md value covers the taller one.
          */}
          <h2
            id={section.id}
            className="scroll-mt-28 font-[family-name:var(--font-display)] text-[length:var(--text-h2)] font-semibold leading-tight text-[var(--color-cocoa)] md:scroll-mt-40"
          >
            {section.heading}
          </h2>
          <div className="prose-editorial mt-6">
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
