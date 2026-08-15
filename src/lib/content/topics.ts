/**
 * Guidance topics.
 *
 * The strongest pattern on the reference site (astroarunpandit.org) is its
 * consultation section: four cards named after the visitor's PROBLEM — birth
 * chart, career, relationships, remedies — rather than after the practitioner's
 * service catalogue.
 *
 * That ordering matters. A visitor arrives thinking "should I take this job",
 * not "I would like to purchase a 45-minute astrological guidance session".
 * Naming the problem first and routing to the service second removes a
 * translation step the visitor would otherwise have to do themselves.
 *
 * `serviceSlug` is a soft hint: if that service does not exist in the database,
 * the card falls back to /services rather than 404ing. Content must never be
 * able to break routing.
 */

export interface GuidanceTopic {
  id: string;
  title: string;
  description: string;
  /** Preferred service to route to; falls back to /services if absent. */
  serviceSlug: string;
  icon: 'compass' | 'briefcase' | 'heart' | 'sparkles' | 'shield' | 'clock';
}

export const GUIDANCE_TOPICS: GuidanceTopic[] = [
  {
    id: 'direction',
    title: 'Life direction & purpose',
    description:
      'You are at a crossroads and the options all look equally plausible. A full chart reading shows the patterns and the timing.',
    serviceSlug: 'astrological-guidance',
    icon: 'compass',
  },
  {
    id: 'career',
    title: 'Career & business',
    description:
      'A move you keep postponing, a decision between two offers, or a business that has stalled. Clear direction, not vague encouragement.',
    serviceSlug: 'life-coaching',
    icon: 'briefcase',
  },
  {
    id: 'marriage',
    title: 'Marriage & compatibility',
    description:
      'A proposal under consideration, a guna score you have been handed, or concern about Mangal Dosha. Read properly, not reduced to a number.',
    serviceSlug: 'kundli-milan',
    icon: 'heart',
  },
  {
    id: 'relationships',
    title: 'Family & relationships',
    description:
      'Strain at home, a conversation you cannot have elsewhere, or a decision affecting people you love. Confidential and unhurried.',
    serviceSlug: 'counselling',
    icon: 'shield',
  },
  {
    id: 'wellbeing',
    title: 'Grief & emotional reset',
    description:
      'A period that has not lifted. Guided energy work and grounding practice you can continue at home, alongside any other care you have.',
    serviceSlug: 'healing-session',
    icon: 'sparkles',
  },
  {
    id: 'timing',
    title: 'Timing & remedies',
    description:
      'When to act, when to wait, and what is worth doing in the meantime. Practical remedies suited to your situation, never sold as a package.',
    serviceSlug: 'astrological-guidance',
    icon: 'clock',
  },
];
