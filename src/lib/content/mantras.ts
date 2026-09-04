/**
 * The nine Navagraha beej mantras, as published on Komal's YouTube channel.
 *
 * SOURCE OF TRUTH: youtube.com/@Astrologerkomalkalra — every id below was read
 * off that channel's own search results, and every Sanskrit line is the one in
 * that video's title. Nothing here is transcribed from memory or reconstructed
 * from a general reference, because a beej mantra with one syllable wrong is
 * not a typo to the people who come to this site for them.
 *
 * If a video is unlisted, deleted or re-uploaded, its card will render an empty
 * player. Re-run the channel search and update the id — do not guess it.
 *
 * ORDER is the traditional Navagraha sequence (Sun through Ketu), not upload
 * date or popularity. Anyone who recognises these expects them in this order.
 */

export interface BeejMantra {
  /** YouTube video id. */
  id: string;
  /** Planet, in the form the audience uses. */
  planet: string;
  /** English gloss, for visitors who do not know the Sanskrit names. */
  english: string;
  /** Devanagari, exactly as titled on the video. */
  sanskrit: string;
  /** Roman transliteration. */
  transliteration: string;
}

export const BEEJ_MANTRAS: readonly BeejMantra[] = [
  {
    id: 'N7ZElB-ZqBk',
    planet: 'Surya',
    english: 'Sun',
    sanskrit: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    transliteration: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
  },
  {
    id: '77catxkA4D8',
    planet: 'Chandra',
    english: 'Moon',
    sanskrit: 'ॐ श्रां श्रीं श्रौं सः चंद्रमसे नमः',
    transliteration: 'Om Shraam Shreem Shraum Sah Chandramase Namah',
  },
  {
    id: 'ybxVeqdVgxI',
    planet: 'Mangal',
    english: 'Mars',
    sanskrit: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    transliteration: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
  },
  {
    id: 's4YC1atNui8',
    planet: 'Budh',
    english: 'Mercury',
    sanskrit: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    transliteration: 'Om Braam Breem Braum Sah Budhaya Namah',
  },
  {
    id: 'irwhX8F1dYs',
    planet: 'Guru',
    english: 'Jupiter',
    sanskrit: 'ॐ ग्रां ग्रीं ग्रौं सः गुरुवे नमः',
    transliteration: 'Om Graam Greem Graum Sah Gurave Namah',
  },
  {
    id: 'QA1Vh_X5DIk',
    planet: 'Shukra',
    english: 'Venus',
    sanskrit: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    transliteration: 'Om Draam Dreem Draum Sah Shukraya Namah',
  },
  {
    id: '_KYYYXVaZWM',
    planet: 'Shani',
    english: 'Saturn',
    sanskrit: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    transliteration: 'Om Praam Preem Praum Sah Shanaishcharaya Namah',
  },
  {
    id: 'heOWCDpG5Iw',
    planet: 'Rahu',
    english: 'North Node',
    sanskrit: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    transliteration: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
  },
  {
    id: 'ibi-USDYAME',
    planet: 'Ketu',
    english: 'South Node',
    sanskrit: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
    transliteration: 'Om Sraam Sreem Sraum Sah Ketave Namah',
  },
] as const;

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@Astrologerkomalkalra';
