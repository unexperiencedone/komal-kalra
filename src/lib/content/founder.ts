/**
 * Founder biography — production copy supplied by the client.
 *
 * Held as structured content rather than inline JSX so the About page and the
 * homepage's "Why Choose" block draw from one source. Previously both carried
 * their own placeholder prose, which is exactly how two versions of a bio end
 * up disagreeing.
 *
 * EDITORIAL NOTE ON WHAT WAS AND WAS NOT CHANGED
 *
 * The copy is the founder's own account of her practice and is reproduced
 * essentially as written. Two small adjustments:
 *
 *  1. British spelling throughout ("behavioural", "specialises"), matching the
 *     rest of the site.
 *  2. "our work" in the pull quote is kept as written — she is speaking about
 *     the practice, and switching it to "my work" would be editing her voice.
 *
 * Nothing here asserts a verifiable statistic (no client counts, no years, no
 * ratings), so it needs no evidence gate the way the testimonials do.
 */

export const FOUNDER = {
  name: 'Astrologer Komal Kalra',
  role: 'Founder & Lead Astrological Consultant',

  /** Standfirst — used on both the About page and as the homepage intro. */
  standfirst:
    'With over 7+ years of experience, Astrologer Komal Kalra is a Vedic astrologer, consultant, and the founder of her private astrological practice. She specialises in translating classical Vedic principles into strategic, actionable insight for modern professionals, entrepreneurs and individuals.',

  body: [
    'With 7+ years of experience and a data-informed approach to planetary cycles — dasha systems, transits, and natal chart synastry — Astrologer Komal Kalra has built a client-centred practice around precision, clarity and practical remediation.',
    'Her methodology strips away fatalistic superstition, treating astrology as a diagnostic and strategic tool for career timing, partnership alignment, and long-term life planning.',
  ],

  competenciesHeading: 'Core competencies & practice focus',
  competencies: [
    {
      title: 'Strategic business & career timing',
      body: 'Identifying favourable planetary windows for transitions, fundraising, business expansion and career pivots.',
    },
    {
      title: 'Relationship & partnership synastry',
      body: 'Deep-dive compatibility and timing assessments for personal marriages and professional partnerships.',
    },
    {
      title: 'Holistic natal diagnostics',
      body: 'Full-spectrum Kundli synthesis covering health, wealth cycles and structural life transitions — Sade Sati, Rahu–Ketu nodal shifts.',
    },
    {
      title: 'Targeted remedial strategy',
      body: 'Actionable, grounded remedies combining gemstone analytics, lifestyle alignment and behavioural remediation.',
    },
  ],

  note: {
    heading: 'A note from the founder',
    quote:
      'When I founded this practice, the goal was simple: to strip away the fear and fatalism often associated with astrology and replace it with clarity, strategic timing, and genuine empowerment. Whether you are navigating a business milestone or a personal transition, our work is designed to help you move forward with confidence and foresight.',
    attribution: 'Astrologer Komal Kalra',
  },

  /**
   * Condensed for the homepage's "Why Choose" block. Deliberately different
   * sentences rather than a truncation of the above — a homepage teaser that is
   * the first 40% of the About page reads like a page that failed to load.
   */
  homepage: [
    'The practice is built on discretion and analytical rigour. Moving away from esoteric cliché, the focus is on providing actionable intelligence derived from classical Vedic systems.',
    'Every consultation is treated as a structured briefing. You receive an objective read on your current cycles and what is coming, so decisions are made from clarity rather than anxiety.',
  ],
  homepageChecklist: [
    'Strict confidentiality protocols',
    'Evidence-based astrological interpretation',
    'Action-oriented remedial strategy',
  ],
} as const;
