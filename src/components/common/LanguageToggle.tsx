'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { LOCALES, LOCALE_LABEL } from '@/lib/i18n/dictionary';
import { cn } from '@/lib/utils';

/**
 * English / ਪੰਜਾਬੀ switch.
 *
 * A two-button group rather than a dropdown: there are exactly two options, and
 * a select hides the fact that Punjabi is available at all behind a click. The
 * whole point is that a Punjabi-speaking visitor notices it without looking.
 *
 * Each label is written IN ITS OWN LANGUAGE — "English" and "ਪੰਜਾਬੀ", never
 * "Punjabi". Someone who reads Gurmukhi more comfortably than Latin script
 * should not have to read English to find the Punjabi option.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language / ਭਾਸ਼ਾ"
      className={cn(
        'inline-flex items-center border border-[var(--color-hairline)]',
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            // aria-pressed rather than aria-current: this is a toggle, not
            // navigation, and nothing about the page's location changes.
            aria-pressed={active}
            lang={l}
            className={cn(
              // Tighter on a phone — this sits next to a two-line wordmark and
              // a hamburger in a 375px bar, and it was the widest thing there.
              'px-1.5 py-0.5 text-[10px] transition-colors sm:px-2.5 sm:py-1 sm:text-xs',
              active
                ? 'bg-[var(--color-cocoa)] text-[var(--color-cream)]'
                : 'text-[var(--color-body-warm)] hover:bg-[var(--color-cream)]',
            )}
          >
            {LOCALE_LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
