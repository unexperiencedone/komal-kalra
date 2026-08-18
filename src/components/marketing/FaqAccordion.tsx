'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';

export interface FaqItem { question: string; answer: string }

/**
 * FAQ accordion — the editorial pattern from the service detail design.
 *
 * Hairline-separated rows, question in body-lg, and a Muted Gold plus that
 * becomes a minus when open. No card, no fill, no radius: the rows ARE the
 * structure, matching the spec's "horizontal hairline rules... mimicking the
 * layout of a luxury broadsheet".
 *
 * Radix rather than <details> for two reasons: correct `aria-expanded` and
 * keyboard behaviour without hand-rolling it, and a `data-state` hook so the
 * icon swap is pure CSS rather than React state.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <Accordion.Item
          key={i}
          value={`item-${i}`}
          className="border-b border-[var(--color-hairline)]"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="text-lg leading-relaxed text-[var(--color-cocoa)] transition-colors duration-300 group-hover:text-[var(--color-saffron-deep)]">
                {item.question}
              </span>
              <span className="relative flex size-5 shrink-0 items-center justify-center text-[var(--color-saffron)]">
                <Plus className="size-5 group-data-[state=open]:hidden" aria-hidden />
                <Minus className="hidden size-5 group-data-[state=open]:block" aria-hidden />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="overflow-hidden">
            <p className="max-w-2xl pb-6 pr-12 text-base leading-relaxed text-[var(--color-body-warm)]">
              {item.answer}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
