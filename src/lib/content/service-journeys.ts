import type { ImageKey } from './imagery';

/**
 * The three-phase "journey" section on each service detail page.
 *
 * WHY THIS IS A CONTENT MODULE AND NOT A DATABASE COLUMN
 *
 * Each phase pairs editorial copy with a specific commissioned photograph. The
 * photographs live in `imagery.ts` as typed keys, so a `process_steps jsonb`
 * column would either store a raw image URL (defeating the local/remote switch)
 * or store a key the database cannot validate. Adding a column also means a
 * migration, and the instruction was to leave the backend intact.
 *
 * Practically: this content changes when the photography changes, which is a
 * deploy-time event, not something Komal edits between sessions. Prices,
 * durations and descriptions — the things she genuinely edits — stay in the
 * database where they belong.
 *
 * HONEST DEGRADATION
 *
 * Only Healing has a full set of three commissioned phase photographs. Rather
 * than reusing another service's imagery — which would misrepresent what a
 * session involves — services without photography render the same layout with
 * the number and copy only. That is a deliberate visual variant, not a bug.
 */

export interface JourneyPhase {
  title: string;
  body: string;
  /** Omitted where no commissioned photograph exists for this phase. */
  image?: ImageKey;
}

export interface ServiceJourney {
  heading: string;
  intro: string;
  phases: [JourneyPhase, JourneyPhase, JourneyPhase];
}

const JOURNEYS: Record<string, ServiceJourney> = {
  'healing-session': {
    heading: 'The Healing Journey',
    intro:
      'A curated three-phase protocol designed to gently guide you back to your natural state of equilibrium.',
    phases: [
      {
        title: 'Intention',
        body: 'We begin by identifying the energetic dissonances within your field, setting a precise and powerful anchor for the session.',
        image: 'healingDetail1',
      },
      {
        title: 'Release',
        body: 'Through focused modality techniques, we systematically clear stagnant energy, creating vast internal space for renewal.',
        image: 'healingDetail2',
      },
      {
        title: 'Integration',
        body: 'The final phase seals the new energetic pathways, ensuring the shifts are grounded into your daily physical reality.',
        image: 'healingDetail3',
      },
    ],
  },

  'astrological-guidance': {
    heading: 'The Consultation Arc',
    intro:
      'A structured reading that moves from what the chart shows, to what it means for you now, to what you do next.',
    phases: [
      {
        title: 'Chart',
        body: 'The full natal chart is read in advance — placements, house emphasis and the dasha periods currently running.',
        image: 'journalCompass',
      },
      {
        title: 'Context',
        body: 'We map what the chart shows against what is actually happening in your life, so the reading answers your questions rather than a general profile.',
      },
      {
        title: 'Direction',
        body: 'The session closes on specifics: what to act on, what to wait out, and a written summary of the key points.',
        image: 'journalCandle',
      },
    ],
  },

  'kundli-milan': {
    heading: 'The Matching Process',
    intro:
      'Traditional Ashtakoot analysis, read alongside both charts in full rather than reduced to a single score.',
    phases: [
      {
        title: 'Guna Milan',
        body: 'The complete 36-guna Ashtakoot analysis, with each koota explained rather than presented as a total.',
        image: 'kundliDetail1',
      },
      {
        title: 'Dosha Review',
        body: 'Mangal Dosha and other afflictions are assessed for their real weight in this specific pairing, not applied as a blanket verdict.',
      },
      {
        title: 'Counsel',
        body: 'Both charts read individually, with clear guidance for the conversation you will need to have with family.',
      },
    ],
  },

  'life-coaching': {
    heading: 'The Coaching Arc',
    intro:
      'A working session built around one decision, ending with a step you can actually take.',
    phases: [
      { title: 'Position', body: 'Where you actually are, stated plainly — including the parts that are easier to talk around.' },
      { title: 'Obstacle', body: 'What is genuinely blocking the decision, separated from what merely feels uncomfortable about it.' },
      { title: 'Step', body: 'One concrete, specific next action agreed before the session ends, with an optional follow-up to check progress.' },
    ],
  },

  counselling: {
    heading: 'How a Session Runs',
    intro: 'Unhurried, confidential, and led by what you need to talk through.',
    phases: [
      { title: 'Space', body: 'The session opens without an agenda. You set what matters, and it is not cut short.' },
      { title: 'Perspective', body: 'An objective, non-judgemental view of the situation — including where a different kind of support would serve you better.' },
      { title: 'Ground', body: 'Practical grounding for whatever comes next, with no pressure to book again.' },
    ],
  },
};

/**
 * The editorial still-life beside "What this session covers".
 *
 * Scoped per service ON PURPOSE. The journal of astronomical notation is
 * specific to chart work — putting it on the Counselling or Healing page would
 * misrepresent what those sessions involve, in the same way reusing another
 * service's journey photographs would.
 *
 * Services without a fitting still-life return null and the column renders as
 * heading and rule alone, which the layout already handles.
 */
const CONTEXT_IMAGE: Record<string, ImageKey> = {
  'astrological-guidance': 'serviceContext',
  // Kundli Milan is also chart work, so the same still-life reads correctly.
  'kundli-milan': 'serviceContext',
};

export function serviceContextImage(slug: string): ImageKey | null {
  return CONTEXT_IMAGE[slug] ?? null;
}

export function serviceJourney(slug: string): ServiceJourney | null {
  return JOURNEYS[slug] ?? null;
}

/**
 * The two info cards beside the pricing block: Location and Preparation.
 * Location is derived from the service's own `mode`, so it can never contradict
 * what the booking flow tells the client.
 */
export function serviceLogistics(mode: 'video' | 'phone' | 'in_person') {
  const location = {
    video: 'Held over a secure video link. A joining link is sent before your session.',
    phone: 'Held over the telephone on the number you provide when booking.',
    in_person: 'Held in person. The address is confirmed once your booking is complete.',
  }[mode];

  return {
    location,
    preparation:
      'Please find a quiet, undisturbed space and have any details or documents you want to discuss to hand.',
  };
}
