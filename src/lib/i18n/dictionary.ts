/**
 * Punjabi / English strings for the booking flow and the main navigation.
 *
 * ⚠️  THE GURMUKHI HAS NOT BEEN REVIEWED BY A NATIVE SPEAKER.
 *
 * It is accurate as far as I can make it, but tone in Punjabi is not something
 * I should be the final judge of on a client-facing site — particularly the
 * register (ਤੁਸੀਂ vs ਤੂੰ) and the astrological vocabulary, where the everyday
 * word and the technical one are often different. KOMAL SHOULD READ THIS FILE
 * BEFORE IT GOES LIVE. It is deliberately one file, laid out side by side, so
 * she can check it without reading any code.
 *
 * SCOPE IS DELIBERATELY NARROW: the booking flow and the nav, the places where
 * language decides whether someone finishes a booking. The legal documents are
 * NOT translated and should not be by me — a mistranslated refund or privacy
 * clause is a liability, and those need a human translator.
 *
 * Anything missing from `pa` falls back to English rather than rendering a key,
 * so a partial translation degrades to a readable page.
 */

export const LOCALES = ['en', 'pa'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  pa: 'ਪੰਜਾਬੀ',
};

/** Every translatable string. `en` is the source of truth and must be complete. */
export const DICT = {
  // ---- Navigation --------------------------------------------------------
  'nav.consultation': { en: 'Consultation', pa: 'ਸਲਾਹ-ਮਸ਼ਵਰਾ' },
  'nav.freeTools': { en: 'Free Tools', pa: 'ਮੁਫ਼ਤ ਸਾਧਨ' },
  /*
   * "About", not "About Komal".
   *
   * The old label named one person, and the /about page now introduces a second
   * practitioner — so it was already inaccurate. Naming a person in navigation
   * is brittle by construction: it has to be revisited every time the practice
   * changes shape. "Our Astrologers" would have the same problem the day a
   * counsellor joins who is not an astrologer.
   *
   * The PAGE stays founder-led — her portrait, her name as the h1 — which is
   * correct for a practice trading under her name. The nav just stops making a
   * claim about how many people work there.
   */
  'nav.about': { en: 'About', pa: 'ਸਾਡੇ ਬਾਰੇ' },
  'nav.faq': { en: 'FAQ', pa: 'ਸਵਾਲ-ਜਵਾਬ' },
  'nav.contact': { en: 'Contact', pa: 'ਸੰਪਰਕ' },
  'nav.book': { en: 'Book a Consultation', pa: 'ਸਲਾਹ ਬੁੱਕ ਕਰੋ' },
  'nav.language': { en: 'Language', pa: 'ਭਾਸ਼ਾ' },

  // ---- Booking: steps ----------------------------------------------------
  'book.title': { en: 'Book your consultation', pa: 'ਆਪਣੀ ਸਲਾਹ ਬੁੱਕ ਕਰੋ' },
  'book.step1': { en: '1. Choose a consultation', pa: '1. ਸਲਾਹ ਚੁਣੋ' },
  'book.step2': { en: '2. Pick a time', pa: '2. ਸਮਾਂ ਚੁਣੋ' },
  'book.step3': { en: '3. Your details', pa: '3. ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ' },

  // ---- Booking: WhatsApp mode -------------------------------------------
  //
  // These are the strings that carry the honesty of the whole flow. "Requested"
  // and "not confirmed until Komal replies" must survive translation, because
  // no slot is actually held.
  'book.wa.howItWorks': {
    en: 'How booking works',
    pa: 'ਬੁਕਿੰਗ ਕਿਵੇਂ ਹੁੰਦੀ ਹੈ',
  },
  'book.wa.step.fill': {
    en: 'Fill in your details below.',
    pa: 'ਹੇਠਾਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਭਰੋ।',
  },
  'book.wa.step.open': {
    en: 'Press the button — WhatsApp opens with your details already typed.',
    pa: 'ਬਟਨ ਦਬਾਓ — ਵਟਸਐਪ ਖੁੱਲ੍ਹੇਗਾ ਅਤੇ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਪਹਿਲਾਂ ਹੀ ਲਿਖੀ ਹੋਵੇਗੀ।',
  },
  'book.wa.step.send': {
    en: 'Send that message. Your booking is not requested until you send it.',
    pa: 'ਉਹ ਸੁਨੇਹਾ ਭੇਜੋ। ਜਦੋਂ ਤੱਕ ਤੁਸੀਂ ਇਹ ਨਹੀਂ ਭੇਜਦੇ, ਬੁਕਿੰਗ ਦੀ ਬੇਨਤੀ ਨਹੀਂ ਹੁੰਦੀ।',
  },
  'book.wa.step.confirm': {
    en: 'Astrologer Komal Kalra replies to confirm the time and arrange payment.',
    pa: 'ਜੋਤਸ਼ੀ ਕੋਮਲ ਕਾਲੜਾ ਜਵਾਬ ਦੇ ਕੇ ਸਮਾਂ ਪੱਕਾ ਕਰੇਗੀ ਅਤੇ ਭੁਗਤਾਨ ਬਾਰੇ ਦੱਸੇਗੀ।',
  },
  'book.wa.cta': {
    en: 'Send booking details on WhatsApp',
    pa: 'ਵਟਸਐਪ ਉੱਤੇ ਬੁਕਿੰਗ ਜਾਣਕਾਰੀ ਭੇਜੋ',
  },
  'book.wa.opened.title': {
    en: 'One more step — press send in WhatsApp',
    pa: 'ਇੱਕ ਹੋਰ ਕਦਮ — ਵਟਸਐਪ ਵਿੱਚ ਭੇਜੋ ਦਬਾਓ',
  },
  'book.wa.opened.body': {
    en: 'Your message is typed and waiting. It has not been sent yet, and we cannot see it until you send it.',
    pa: 'ਤੁਹਾਡਾ ਸੁਨੇਹਾ ਲਿਖਿਆ ਹੋਇਆ ਤਿਆਰ ਹੈ। ਇਹ ਹਾਲੇ ਭੇਜਿਆ ਨਹੀਂ ਗਿਆ, ਅਤੇ ਜਦੋਂ ਤੱਕ ਤੁਸੀਂ ਨਹੀਂ ਭੇਜਦੇ ਸਾਨੂੰ ਦਿਖਾਈ ਨਹੀਂ ਦਿੰਦਾ।',
  },
  'book.wa.opened.retry': {
    en: 'WhatsApp did not open? Tap here',
    pa: 'ਵਟਸਐਪ ਨਹੀਂ ਖੁੱਲ੍ਹਿਆ? ਇੱਥੇ ਦਬਾਓ',
  },
  'book.wa.notReserved': {
    en: 'Times shown are requested, not reserved. Astrologer Komal Kalra confirms your slot by reply.',
    pa: 'ਵਿਖਾਏ ਗਏ ਸਮੇਂ ਸਿਰਫ਼ ਬੇਨਤੀ ਹਨ, ਰਾਖਵੇਂ ਨਹੀਂ। ਜੋਤਸ਼ੀ ਕੋਮਲ ਕਾਲੜਾ ਜਵਾਬ ਦੇ ਕੇ ਸਮਾਂ ਪੱਕਾ ਕਰੇਗੀ।',
  },
  'book.wa.noPaymentNow': {
    en: 'Nothing is charged on this website. Payment is arranged with Astrologer Komal Kalra directly.',
    pa: 'ਇਸ ਵੈੱਬਸਾਈਟ ਉੱਤੇ ਕੋਈ ਭੁਗਤਾਨ ਨਹੀਂ ਲਿਆ ਜਾਂਦਾ। ਭੁਗਤਾਨ ਜੋਤਸ਼ੀ ਕੋਮਲ ਕਾਲੜਾ ਨਾਲ ਸਿੱਧਾ ਤੈਅ ਹੁੰਦਾ ਹੈ।',
  },

  'book.wa.or': { en: 'or', pa: 'ਜਾਂ' },
  'book.wa.direct': {
    en: 'Message Astrologer Komal Kalra directly',
    pa: 'ਜੋਤਸ਼ੀ ਕੋਮਲ ਕਾਲੜਾ ਨੂੰ ਸਿੱਧਾ ਸੁਨੇਹਾ ਭੇਜੋ',
  },
  'book.wa.directHint': {
    en: 'Skip the form and start a conversation. Useful if you are not sure which session you need.',
    pa: 'ਫਾਰਮ ਛੱਡ ਕੇ ਸਿੱਧੀ ਗੱਲ ਸ਼ੁਰੂ ਕਰੋ। ਜੇ ਤੁਹਾਨੂੰ ਪਤਾ ਨਹੀਂ ਕਿਹੜੀ ਸੇਵਾ ਚਾਹੀਦੀ ਹੈ ਤਾਂ ਇਹ ਸੌਖਾ ਹੈ।',
  },

  // ---- Booking: fields ---------------------------------------------------
  'field.fullName': { en: 'Full name', pa: 'ਪੂਰਾ ਨਾਮ' },
  'field.email': { en: 'Email', pa: 'ਈਮੇਲ' },
  'field.phone': { en: 'Phone', pa: 'ਫ਼ੋਨ ਨੰਬਰ' },
  'field.phoneHint': {
    en: 'Your booking details are sent to this number on WhatsApp.',
    pa: 'ਤੁਹਾਡੀ ਬੁਕਿੰਗ ਦੀ ਜਾਣਕਾਰੀ ਇਸੇ ਨੰਬਰ ਉੱਤੇ ਵਟਸਐਪ ਰਾਹੀਂ ਭੇਜੀ ਜਾਵੇਗੀ।',
  },
  'field.birthDetails': { en: 'Birth details', pa: 'ਜਨਮ ਦੀ ਜਾਣਕਾਰੀ' },
  'field.birthDate': { en: 'Date of birth', pa: 'ਜਨਮ ਮਿਤੀ' },
  'field.birthTime': { en: 'Time of birth', pa: 'ਜਨਮ ਸਮਾਂ' },
  'field.birthTimeUnknown': {
    en: 'I am not sure of the exact birth time',
    pa: 'ਮੈਨੂੰ ਸਹੀ ਜਨਮ ਸਮਾਂ ਨਹੀਂ ਪਤਾ',
  },
  'field.birthCity': { en: 'City of birth', pa: 'ਜਨਮ ਸ਼ਹਿਰ' },
  'field.birthState': { en: 'State of birth', pa: 'ਜਨਮ ਰਾਜ' },
  'field.birthCountry': { en: 'Country of birth', pa: 'ਜਨਮ ਦੇਸ਼' },
  'field.question': {
    en: 'What would you like to discuss?',
    pa: 'ਤੁਸੀਂ ਕਿਸ ਬਾਰੇ ਗੱਲ ਕਰਨੀ ਚਾਹੁੰਦੇ ਹੋ?',
  },
  'field.optional': { en: 'Optional', pa: 'ਮਰਜ਼ੀ ਨਾਲ' },

  // ---- Shared ------------------------------------------------------------
  'common.confidential': {
    en: '100% Confidential. Everything you discuss stays between you and Astrologer Komal Kalra.',
    pa: '100% ਗੁਪਤ। ਤੁਹਾਡੀ ਸਾਰੀ ਗੱਲਬਾਤ ਤੁਹਾਡੇ ਅਤੇ ਜੋਤਸ਼ੀ ਕੋਮਲ ਕਾਲੜਾ ਵਿਚਕਾਰ ਹੀ ਰਹਿੰਦੀ ਹੈ।',
  },
  'common.callInstead': { en: 'Call us instead', pa: 'ਸਾਨੂੰ ਫ਼ੋਨ ਕਰੋ' },
} as const;

export type MessageKey = keyof typeof DICT;

/** Falls back to English rather than showing a key. */
export function translate(key: MessageKey, locale: Locale): string {
  const entry = DICT[key] as { en: string; pa?: string };
  return (locale === 'pa' ? entry.pa : entry.en) || entry.en;
}
