'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LOCALES, translate, type Locale, type MessageKey } from './dictionary';

/**
 * Language switching for the booking flow and the navigation.
 *
 * WHY THIS AND NOT next-intl
 *
 * The proper answer for a fully bilingual site is locale-prefixed routes
 * (`/pa/services`), because that is what gives each language its own indexable
 * URL. But the agreed scope is the booking flow and the nav — two surfaces —
 * and `/book` is already `noindex`, so there is no SEO to win there. Adding a
 * routing layer, a middleware matcher and a rewrite for every existing page to
 * translate two of them would be a large change to the whole app in exchange
 * for nothing on the pages that matter.
 *
 * If the marketing pages are translated later, that IS the point to move to
 * next-intl and locale routes, and this provider should be replaced rather than
 * grown. It is deliberately small so that swap stays cheap.
 *
 * The choice is stored in localStorage and read after mount, never during
 * render — reading it during render would make the server and client markup
 * disagree and produce a hydration mismatch. The first paint is always English;
 * a visitor who chose Punjabi sees it switch on mount.
 */

const STORAGE_KEY = 'kk.locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translate(key, 'en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (LOCALES as readonly string[]).includes(saved)) {
        setLocaleState(saved as Locale);
      }
    } catch {
      // Private browsing, or storage disabled. English is a fine default and a
      // language toggle is not worth an error boundary.
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* choice simply does not persist */
    }
    // Keeps screen readers and browser translation heuristics in step with what
    // is actually on screen.
    document.documentElement.lang = l === 'pa' ? 'pa' : 'en';
  }, []);

  const t = useCallback((key: MessageKey) => translate(key, locale), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Convenience for components that only need to translate. */
export function useT() {
  return useContext(LanguageContext).t;
}
