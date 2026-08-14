'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

export interface FaqItem { question: string; answer: string }

/**
 * FAQ accordion. Radix gives correct keyboard behaviour and aria-expanded
 * wiring for free, which is the whole reason to use a primitive here rather
 * than <details> — <details> cannot be styled consistently across browsers for
 * the open/close transition.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-[var(--color-linen)]">
      {items.map((item, i) => (
        <Accordion.Item key={i} value={`item-${i}`}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-start justify-between gap-4 py-5 text-left">
              <span className="text-[15px] font-medium text-[var(--color-ink)]">{item.question}</span>
              <ChevronDown
                className="mt-0.5 size-4 shrink-0 text-[var(--color-stone)] transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
            <p className="pb-5 pr-8 text-sm leading-relaxed text-[var(--color-bark)]">{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
