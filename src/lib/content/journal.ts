import type { FaqItem } from '@/components/marketing/FaqAccordion';
import type { ImageKey } from './imagery';
import { KOMAL, SUNIL_SHARMA, type Practitioner } from './practitioners';

/**
 * The blog.
 *
 * WHY A BLOG AT ALL, AND WHY THESE POSTS
 *
 * Everything else on this site is a page someone reads once they have already
 * decided to consider booking. There was nothing for the much larger group who
 * are not there yet — someone who has just been told by a relative that they
 * are "in Sade Sati" or "Manglik", is frightened, and is searching at eleven at
 * night. Those two phrases are among the highest-volume astrology searches in
 * India, and most of what is written about them is written to sell a remedy:
 * the fear is manufactured in one paragraph and the gemstone is sold in the
 * next.
 *
 * That is the opening. This practice already positions itself against exactly
 * that — "no fear-based predictions, and nothing is sold to you afterwards"
 * (SeoProse), "strips away fatalistic superstition" (FOUNDER.body). A post that
 * takes the most frightening term in the discipline and calmly de-escalates it
 * is that same promise demonstrated rather than asserted. Someone who arrives
 * frightened and leaves calmer has been given something before being asked for
 * anything, and that is what a booking is eventually made of.
 *
 * So the three posts do three different jobs and are not interchangeable:
 *
 *   sade-sati-explained     ranks. Highest search volume, highest anxiety.
 *   mangal-dosha-marriage   builds trust. It admits, in print, that competent
 *                           astrologers disagree about how Manglik is judged.
 *                           Nothing reads as honest like publishing the limits
 *                           of your own discipline.
 *   your-first-consultation converts. Removes the friction that actually stops
 *                           bookings — not knowing the birth time, not knowing
 *                           what to ask, not knowing what will be done to you.
 *
 * WHY THE CONTENT IS TYPED DATA AND NOT MARKDOWN
 *
 * There is no Markdown or MDX pipeline in this project, and adding one to
 * render three articles would mean a dependency, a build step and a sanitiser
 * for something the type system already does for free. Posts are therefore
 * typed block trees. The trade is real — writing a post means writing
 * TypeScript — but it buys three things worth more than the convenience: a
 * block kind that does not exist is a build error rather than a paragraph of
 * raw asterisks; a `tool` block cannot point at a calculator that was never
 * built, because the assertion at the foot of this file checks every one; and
 * each post's FAQ is the same `FaqItem` shape the rest of the site already
 * renders and publishes as FAQPage structured data.
 *
 * WHAT MUST NOT BE WRITTEN HERE
 *
 * No prices, no session durations, no restatements of the cancellation policy.
 * Those live in config.ts and in the database, and they change. A blog post
 * that quotes them goes wrong quietly and stays wrong for months, because
 * nobody re-reads an article after publishing it. Link to the page that owns
 * the fact instead.
 */

/**
 * A paragraph, or one of the four things that are not a paragraph.
 *
 * Deliberately a small closed set. Every kind added here is a kind the article
 * renderer has to lay out, and a format with fifteen block types is one nobody
 * can keep looking consistent.
 */
export type JournalBlock =
  /** Body copy. One paragraph. */
  | { kind: 'p'; text: string }
  /** Unordered points. Use where the order carries no meaning. */
  | { kind: 'list'; items: string[] }
  /** Ordered stages, each with its own label. Used for the Sade Sati phases. */
  | { kind: 'steps'; items: { title: string; text: string }[] }
  /** A set-apart aside — what a skim-reader should still leave with. */
  | { kind: 'callout'; title: string; text: string }
  /**
   * An inline link to one of the free calculators.
   *
   * THIS IS THE POINT OF THE BLOG, MECHANICALLY.
   *
   * An article that ends at "book a consultation" asks a stranger for money on
   * first contact. An article that ends at "here is the free tool that answers
   * this for your own chart" asks for nothing, and the tool pages already
   * carry the lead capture. Article → calculator → consultation is a route
   * someone can walk at their own speed.
   *
   * `slug` must be a key of TOOLS in (marketing)/free-tools/[tool]/page.tsx.
   * TOOL_SLUGS at the foot of this file is checked against it, because a dead
   * link inside a trust-building article is worse than no link.
   */
  | { kind: 'tool'; slug: string; label: string; text: string };

export type JournalSection = {
  /** Anchor id, used by the in-article contents list. */
  id: string;
  heading: string;
  blocks: JournalBlock[];
};

export type JournalPost = {
  slug: string;
  title: string;
  /** Overrides `title` in <title> when the headline is too long for a SERP. */
  seoTitle?: string;
  /**
   * The headline for surfaces a headline does not fit — currently the footer
   * column, which is roughly 220px wide.
   *
   * Required rather than optional on purpose. Falling back to `title` would
   * "work", in the sense that nothing would throw; it would also silently put
   * a sixty-character sentence into a footer link and wrap it to four lines,
   * and nobody would notice until they looked at the footer on a phone. A
   * required field makes the constrained surface a thing the author has to
   * think about once, when the post is written.
   */
  shortTitle: string;
  description: string;
  /** The standfirst under the headline. One sentence, two at the outside. */
  standfirst: string;
  /**
   * Who wrote it — the same Practitioner record the service pages use.
   *
   * Not a free-text string. The byline on an article and the portrait on the
   * booking panel are claims about the same person, and the moment they live
   * in two places is the moment one of them gets updated alone. The note at
   * the top of practitioners.ts is the same argument at greater length.
   */
  author: Practitioner;
  /** ISO date. Rendered, and published as datePublished in Article schema. */
  publishedAt: string;
  /** ISO date. Set it when the substance changes, not for a typo fix. */
  updatedAt?: string;
  image: ImageKey;
  /** Shown as a category chip on the index. One or two, not five. */
  tags: string[];
  sections: JournalSection[];
  /** Rendered as an accordion, and published as FAQPage structured data. */
  faq: FaqItem[];
};

/* ------------------------------------------------------------------------- *
 *  Posts
 * ------------------------------------------------------------------------- */

const SADE_SATI: JournalPost = {
  slug: 'sade-sati-explained',
  title: 'Sade Sati: what Saturn’s seven and a half years actually ask of you',
  seoTitle: 'Sade Sati Explained: The Three Phases, and What It Does Not Mean',
  shortTitle: 'Sade Sati explained',
  description:
    'A calm, practical explanation of Sade Sati — what Saturn’s transit over your Moon sign actually is, the three phases, and the things it is routinely and wrongly blamed for.',
  standfirst:
    'It is the most feared phrase in Vedic astrology and the most misrepresented. Here is what it is, how to tell whether you are in it, and what it genuinely asks of you.',
  author: KOMAL,
  publishedAt: '2026-09-22',
  image: 'journalCompass',
  tags: ['Transits', 'Saturn'],
  sections: [
    {
      id: 'what-it-is',
      heading: 'What Sade Sati actually is',
      blocks: [
        {
          kind: 'p',
          text: 'Sade Sati is a transit, not a verdict. Saturn takes roughly two and a half years to cross each sign of the zodiac, and about thirty years to cross all twelve. Sade Sati is the stretch during which Saturn passes through three consecutive signs: the one before your Moon sign, your Moon sign itself, and the one after it. Three signs, two and a half years each — seven and a half years in total. That is the whole of it. The name simply means “seven and a half”.',
        },
        {
          kind: 'p',
          text: 'Because Saturn comes back around every thirty years or so, most people live through Sade Sati two or three times. If you are thirty-two and being told this is a once-in-a-lifetime ordeal, it is worth knowing that you were almost certainly in it as a small child and did not notice, and that you may well be in it again in your sixties.',
        },
        {
          kind: 'p',
          text: 'One technical point matters more than any other, and it is the thing most often got wrong: Sade Sati is measured from your Moon sign — your Rashi, the sign the Moon occupied at your birth. It is not measured from your Sun sign, and it has nothing to do with the star sign in a newspaper column. Anyone who has worked this out from their birth month has worked it out from the wrong number.',
        },
      ],
    },
    {
      id: 'am-i-in-it',
      heading: 'How to tell whether you are in it',
      blocks: [
        {
          kind: 'p',
          text: 'You need two things: your Moon sign, and where Saturn is now. The second is public information. The first needs your date, time and place of birth — though the Moon only changes sign every two and a quarter days or so, which is why an approximate birth time is usually good enough for this particular question, even where it would not be enough for others.',
        },
        {
          kind: 'tool',
          slug: 'sade-sati',
          label: 'Check your Sade Sati phase',
          text: 'Enter your birth details and the calculator works out whether Saturn is currently transiting the twelfth, first or second sign from your natal Moon, and the dates each phase turns.',
        },
        {
          kind: 'p',
          text: 'If you do not know your Moon sign at all, start there instead. It is worth knowing for its own sake — a great deal of Vedic astrology is read from the Moon rather than from the ascendant.',
        },
        {
          kind: 'tool',
          slug: 'moon-sign',
          label: 'Find your Moon sign',
          text: 'Your Rashi, and the emotional pattern that placement is associated with.',
        },
      ],
    },
    {
      id: 'three-phases',
      heading: 'The three phases, and what each tends to ask',
      blocks: [
        {
          kind: 'p',
          text: 'The three phases are genuinely different from one another, and lumping them together as “seven and a half bad years” is most of what makes the term frightening. Each is Saturn moving through a different position relative to your Moon, and each has a recognisable character.',
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'First phase — Saturn in the sign before your Moon',
              text: 'Classically the phase of exits and expenditure. Things that were already ending tend to finish during it: a role you had outgrown, a city you were finished with, an arrangement that had quietly stopped working. Sleep is often disturbed and outgoings often rise. What it usually is not is a surprise — most people, looking back, can name what was already on its way out before the transit began.',
            },
            {
              title: 'Second phase — Saturn on your Moon',
              text: 'The middle stretch, and the one that genuinely asks something. Saturn sitting on the natal Moon presses on mood, energy and sense of self, and this is the phase in which people describe feeling heavy, slow, or older than they are. It is also, reliably, the phase in which people do their most serious work — that pressure is not easily distinguished from concentration. Rest is not optional here, and it is not laziness.',
            },
            {
              title: 'Third phase — Saturn in the sign after your Moon',
              text: 'The rebuilding phase, concerned with money, family and what you say. Finances usually need rearranging rather than rescuing. Conversations postponed during the middle phase come due. For most people this is where the structure built under pressure starts paying, and the difficult part is behind them — the tiredness is simply the last thing to lift.',
            },
          ],
        },
        {
          kind: 'p',
          text: 'How any of this lands depends on the rest of your chart: where Saturn sits natally and how strong it is, which planetary period — which dasha — you are running, and what else is transiting at the same time. Two people entering Sade Sati in the same month can have entirely different seven and a half years. That is not a hedge; it is the reason a general article cannot tell you what yours will be like.',
        },
      ],
    },
    {
      id: 'what-it-is-not',
      heading: 'What Sade Sati is not',
      blocks: [
        {
          kind: 'p',
          text: 'Most of the damage this term does is done by claims that are simply not in the classical material. The following are worth stating plainly.',
        },
        {
          kind: 'list',
          items: [
            'It is not a curse, and it is not a punishment for something you did in this life or another.',
            'It is not seven and a half years of continuous misfortune. The first and third phases are materially lighter than the middle one, and plenty of people have their strongest professional years inside the transit — Saturn rewards sustained, unglamorous effort, which is what long work is made of.',
            'It is not a reason to postpone a marriage, refuse a job, delay a business or cancel a house purchase. Timing decisions are read from the whole chart and the running dasha, never from a single transit.',
            'It does not predict illness or death. An astrologer who tells you it does has left the discipline and entered something else.',
            'It is not made worse by failing to buy anything.',
          ],
        },
        {
          kind: 'callout',
          title: 'If you take one thing from this page',
          text: 'Sade Sati describes a period that asks for structure, patience and honest effort. It does not describe a period in which good outcomes are unavailable. Those are very different claims, and the second one is the one being sold to you.',
        },
      ],
    },
    {
      id: 'what-helps',
      heading: 'What actually helps',
      blocks: [
        {
          kind: 'p',
          text: 'Saturn responds to conduct. That is not a metaphor for anything mystical — the remedies classical texts attach to Saturn are almost entirely behavioural, and they read like sound advice for a demanding few years because that is what they are.',
        },
        {
          kind: 'list',
          items: [
            'Keep a routine, and keep it on the days you least want to. Saturn is the planet of consistency, and the middle phase is where consistency collapses.',
            'Protect your sleep. Disturbed sleep is the most commonly reported feature of this transit, and it makes everything else on this list harder.',
            'Honour what you have committed to, and commit to less. Unfinished obligations accumulate visibly under Saturn.',
            'Do something useful for people with less than you, regularly and without an audience. Service is the oldest prescribed Saturn remedy there is.',
            'Postpone speculation. This is not a transit that rewards a gamble taken in order to escape it.',
            'Handle the dull maintenance — the paperwork, the health check, the filing, the conversation you have been avoiding. It is exactly the category of thing this period will otherwise make expensive.',
          ],
        },
        {
          kind: 'p',
          text: 'You will notice that nothing on that list is for sale. This practice does not sell gemstones, yantras, pujas or protective items, and takes no commission from anyone who does. If a remedy for Sade Sati is quoted to you with a price attached before anybody has read your chart, that is a transaction wearing the clothes of a tradition.',
        },
      ],
    },
    {
      id: 'when-to-consult',
      heading: 'When a consultation is worth it — and when it is not',
      blocks: [
        {
          kind: 'p',
          text: 'It is not worth paying anyone to tell you whether you are in Sade Sati. That is arithmetic, the calculator above does it, and no reading is required.',
        },
        {
          kind: 'p',
          text: 'A consultation earns its place when the question is specific and the answer depends on the rest of your chart. Which phase you are actually in and when it turns. Whether the difficulty you are having is this transit or the dasha running underneath it — because the two ask for opposite responses. Whether a decision you are weighing should be taken now or in eleven months. What the rest of the chart says about which area of life is carrying the pressure.',
        },
        {
          kind: 'p',
          text: 'And if you have been frightened by something somebody told you, bring it. Being told precisely what a claim rests on — and often that it rests on nothing — is a legitimate reason to book, and it is a conversation we have regularly.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How do I know if I am in Sade Sati?',
      answer:
        'Sade Sati runs while Saturn transits the sign before your natal Moon sign, your Moon sign itself, and the sign after it — about seven and a half years in total. It is calculated from your Moon sign, not your Sun sign, so you need your date, time and place of birth. The free Sade Sati calculator on this site works it out and gives you the dates of each phase.',
    },
    {
      question: 'Which phase of Sade Sati is the hardest?',
      answer:
        'The middle phase, when Saturn transits over your natal Moon, is usually the most demanding — it tends to affect mood, energy and sleep most directly. The first phase is generally associated with endings and higher expenditure, and the third with rebuilding finances and family matters. How each phase actually lands depends on Saturn’s position and strength in your own chart, and on the planetary period you are running.',
    },
    {
      question: 'Is Sade Sati always bad?',
      answer:
        'No. Sade Sati is a period that asks for structure, patience and sustained effort, and many people do their most significant professional work during it. It is not a guarantee of misfortune and it does not make good outcomes unavailable. Classical astrology treats it as a testing transit, not a punishment.',
    },
    {
      question: 'Should I delay marriage or starting a business during Sade Sati?',
      answer:
        'Not on the basis of Sade Sati alone. Timing for a marriage, a business launch or a major purchase is read from the whole chart and from the planetary period you are running, not from a single transit. Postponing a sound decision for seven and a half years because of one factor usually costs more than the transit does.',
    },
    {
      question: 'What remedies work for Sade Sati?',
      answer:
        'The classical remedies for Saturn are behavioural: keeping a routine, protecting your sleep, honouring your commitments, regular service to people worse off than you, and avoiding speculation. This practice does not sell gemstones, yantras or pujas, and takes no commission from anyone who does.',
    },
  ],
};

const MANGAL_DOSHA: JournalPost = {
  slug: 'mangal-dosha-marriage',
  title: 'Manglik: a calmer reading of Mangal Dosha and marriage',
  seoTitle: 'Mangal Dosha and Marriage: What Manglik Actually Means',
  shortTitle: 'Mangal Dosha & marriage',
  description:
    'What Mangal Dosha is, why two competent astrologers can give you different answers about it, the classical cancellations that are routinely left out, and what a proper compatibility assessment actually looks at.',
  standfirst:
    'Few labels have broken off more matches on less evidence. This is what the classical texts actually say — including the parts usually left out.',
  author: SUNIL_SHARMA,
  publishedAt: '2026-09-22',
  image: 'journalCandle',
  tags: ['Compatibility', 'Mars'],
  sections: [
    {
      id: 'what-it-is',
      heading: 'What Manglik actually means',
      blocks: [
        {
          kind: 'p',
          text: 'Mangal Dosha — also called Kuja Dosha, and in everyday speech simply being “Manglik” — describes Mars occupying particular houses in a birth chart. The houses usually cited are the first, second, fourth, seventh, eighth and twelfth. The reasoning behind the tradition is straightforward: Mars is the planet of heat, assertion and force, and those six houses touch the body, the family and speech, the home, the marriage itself, longevity, and the private and intimate part of life. Mars placed there is read as bringing more force to the marriage than the marriage may comfortably carry.',
        },
        {
          kind: 'p',
          text: 'That is the entire technical claim. It is a statement about the temperature of a relationship, not a prophecy about its ending — and certainly not a statement about the character of the person who has it.',
        },
      ],
    },
    {
      id: 'why-answers-differ',
      heading: 'Why two astrologers can give you different answers',
      blocks: [
        {
          kind: 'p',
          text: 'This is the part rarely said out loud, and it is the most useful thing on this page: the classical traditions do not agree on how Mangal Dosha is judged, and an honest practitioner should tell you so before telling you anything else.',
        },
        {
          kind: 'list',
          items: [
            'They disagree on the reference point. Some traditions count the houses from the ascendant, some from the Moon, and some from Venus. A chart can be Manglik from one of those and not from the others, and both readings are defensible within their own lineage.',
            'They disagree on the house list. The second and twelfth houses are included in some traditions and excluded in others, and regional practice in North and South India differs in exactly this way.',
            'They disagree on how much weight the dosha carries once the cancellations below are applied.',
          ],
        },
        {
          kind: 'p',
          text: 'So when one astrologer says you are Manglik and another says you are not, you have usually not caught anybody lying. You have found the seam between two schools. What you are entitled to ask, and should ask, is which reference point was used and why — and any practitioner worth consulting will answer that question directly rather than treating it as a challenge.',
        },
        {
          kind: 'callout',
          title: 'A reasonable question to ask anyone who gives you this label',
          text: '“From which point did you count — the ascendant, the Moon, or Venus, and did you apply the cancellations?” If the answer is vague, or the next sentence is about a remedy that costs money, you have learned what you needed to learn about the reading.',
        },
      ],
    },
    {
      id: 'cancellations',
      heading: 'The cancellations nobody mentions',
      blocks: [
        {
          kind: 'p',
          text: 'Classical texts describe a long list of conditions under which Mangal Dosha is considered cancelled or substantially reduced. These are not a modern softening invented to reassure people — they are in the same material the dosha itself comes from, and they are left out of the frightening version because a cancelled dosha is difficult to sell a remedy for.',
        },
        {
          kind: 'list',
          items: [
            'Mars in its own sign, or exalted, or in the sign of a friendly planet, is widely held to be far less troublesome in these positions.',
            'Mars aspected by or conjunct Jupiter — and in several traditions the Moon — is treated as considerably moderated.',
            'Where both partners have the dosha, most traditions hold that it cancels, on the straightforward logic that the two charts are matched in temperament rather than mismatched.',
            'Several traditions hold that the dosha weakens with age, and many practitioners consider it materially reduced by the late twenties.',
            'Particular sign placements are held to nullify it, and the specific list varies between traditions.',
          ],
        },
        {
          kind: 'p',
          text: 'Once these are applied properly, a substantial proportion of charts that get casually labelled Manglik are not carrying a meaningful dosha at all. The label is applied far more often than the condition survives examination — which is why a second opinion on this particular question is so often worth having.',
        },
      ],
    },
    {
      id: 'what-it-does-not-justify',
      heading: 'What the label does not justify',
      blocks: [
        {
          kind: 'p',
          text: 'Some things should be said plainly, because they are the real harm this term does and no amount of technical accuracy above matters if they go unsaid.',
        },
        {
          kind: 'list',
          items: [
            'It is not a reason to call off a match on its own. A single factor in one chart is not an assessment of a marriage.',
            'It says nothing about anyone’s character, temper or worth as a partner.',
            'It does not predict the death of a spouse. This claim is made frequently and cruelly, and it does not follow from the technical position described above.',
            'It is not a reason to pay for an elaborate ceremonial fix. Where a genuine dosha exists and a traditional remedy is appropriate, that is a conversation to have with your family and your own priest — not a product to be sold by whoever gave you the diagnosis.',
          ],
        },
        {
          kind: 'p',
          text: 'If you have been told you are Manglik and the same conversation ended with a price, you were not given a reading. You were given a sales call with astrology in it.',
        },
      ],
    },
    {
      id: 'proper-matching',
      heading: 'What a proper compatibility assessment looks at',
      blocks: [
        {
          kind: 'p',
          text: 'Traditional matching — Ashtakoot Milan — scores eight factors out of a total of thirty-six gunas, covering temperament, mental compatibility, health and progeny, and much else. It is a useful instrument. It is also routinely misused, because a number out of thirty-six is easy to quote and easy to treat as a verdict.',
        },
        {
          kind: 'p',
          text: 'A serious assessment reads the guna score as one input among several: the condition of the seventh house in both charts, where Venus and Jupiter sit, the strength and placement of Mars in each chart rather than the presence of a label, and — most practically of all — the planetary periods both people are running, since the timing of a marriage often matters more to how it starts than the comparison of the two charts does.',
        },
        {
          kind: 'tool',
          slug: 'mangal-dosha',
          label: 'Check Mangal Dosha for your chart',
          text: 'Enter your birth details for an analysis of Mars’ placement, rather than a yes-or-no label with nothing behind it.',
        },
        {
          kind: 'tool',
          slug: 'kundli-matching',
          label: 'Run an Ashtakoot Milan',
          text: 'The thirty-six guna comparison for two charts — useful as a starting point, and not intended as a verdict.',
        },
      ],
    },
    {
      id: 'when-to-consult',
      heading: 'When it is worth speaking to someone',
      blocks: [
        {
          kind: 'p',
          text: 'If a match is being questioned on the strength of this label, a consultation is worth it — not to be reassured, but to find out which reference point produced the finding, whether the cancellations apply, and what the rest of both charts actually says. That is a concrete question with a concrete answer.',
        },
        {
          kind: 'p',
          text: 'What we will not do is confirm a frightening verdict because it was arrived at somewhere else, or supply one because a family is hoping to hear it. If the charts are fine, you will be told they are fine.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What does it mean to be Manglik?',
      answer:
        'Being Manglik, or having Mangal Dosha, means Mars occupies certain houses in your birth chart — usually cited as the first, second, fourth, seventh, eighth or twelfth. Because Mars is the planet of heat and assertion, the tradition reads that placement as bringing more force to a marriage than it may comfortably carry. It is a statement about temperament, not a prophecy about an outcome.',
    },
    {
      question: 'Why do different astrologers disagree about whether I am Manglik?',
      answer:
        'Because the classical traditions genuinely disagree on how it is judged. Some count the houses from the ascendant, others from the Moon, others from Venus, and the list of houses itself differs between North and South Indian practice. A chart can be Manglik by one method and not by another. Ask which reference point was used — the answer should be given plainly.',
    },
    {
      question: 'Can Mangal Dosha be cancelled?',
      answer:
        'Yes, and the cancellations are in the classical material rather than being a modern softening. Mars in its own or exalted sign, Mars aspected by Jupiter, both partners having the dosha, and increasing age are all widely held to cancel or substantially reduce it. Once these are applied properly, a large share of charts casually labelled Manglik do not carry a meaningful dosha.',
    },
    {
      question: 'Should a marriage be called off because one person is Manglik?',
      answer:
        'No. A single factor in one chart is not an assessment of a marriage. A proper compatibility reading looks at the seventh house in both charts, the placement and strength of Mars rather than the presence of a label, Venus and Jupiter, the guna score, and the planetary periods both people are running.',
    },
    {
      question: 'Does Mangal Dosha predict harm to a spouse?',
      answer:
        'No. That claim is made often and it does not follow from the technical position — which concerns the intensity of a relationship, not the length of anyone’s life. This practice does not make predictions of that kind.',
    },
  ],
};

const FIRST_CONSULTATION: JournalPost = {
  slug: 'your-first-consultation',
  title: 'What to bring to your first astrology consultation',
  seoTitle: 'Your First Astrology Consultation: What to Bring and What to Expect',
  shortTitle: 'Your first consultation',
  description:
    'How to find your birth time, how to phrase your questions so they can actually be answered, what a session sounds like, and what this practice will not do.',
  standfirst:
    'Most of what makes a first consultation feel uncertain is practical, not mystical. Here is all of it, in advance.',
  author: KOMAL,
  publishedAt: '2026-09-22',
  image: 'astroToolsFlatlay',
  tags: ['Practice', 'Before you book'],
  sections: [
    {
      id: 'birth-time',
      heading: 'The one detail that matters most: your birth time',
      blocks: [
        {
          kind: 'p',
          text: 'Date and place of birth are easy. Time is the one people get stuck on, and it matters because the ascendant — the sign rising on the eastern horizon at your birth — moves through all twelve signs every twenty-four hours, roughly one every two hours. The ascendant sets the entire house structure of the chart, which is what tells an astrologer which area of your life a planet is actually operating in.',
        },
        {
          kind: 'p',
          text: 'Places worth looking before you conclude you do not have it:',
        },
        {
          kind: 'list',
          items: [
            'Your birth certificate. In India the time is often recorded on the municipal or hospital-issued certificate even when it is absent from later documents.',
            'The hospital record, if the birth was in a hospital that still holds archives.',
            'A family horoscope. If a janam kundli was drawn up when you were born — extremely common — the time is on it, and an older relative usually knows where it is.',
            'Your parents’ memory. "Just before the morning tea" or "during the evening news" is a usable window, and far better than nothing.',
          ],
        },
        {
          kind: 'callout',
          title: 'If you genuinely cannot find it, book anyway',
          text: 'A great deal of Vedic astrology is read from the Moon rather than from the ascendant, and the Moon only changes sign every two and a quarter days — so transits, dashas and much of the timing work stand up without an exact time. Bring whatever you have, including a rough window. "I am not sure" is a normal answer, not a problem to be solved before you are allowed to book.',
        },
        {
          kind: 'tool',
          slug: 'free-kundli',
          label: 'Generate your kundli first',
          text: 'Enter what you have and see your own chart before the session. It costs nothing, and arriving having already looked at it makes the conversation better.',
        },
      ],
    },
    {
      id: 'your-questions',
      heading: 'Write your questions down, and phrase them well',
      blocks: [
        {
          kind: 'p',
          text: 'The single biggest difference between a session that feels worth it and one that does not is whether the person arrived knowing what they wanted to ask. It is very easy to spend a whole consultation on interesting general observations and hang up realising you never asked the thing you booked for.',
        },
        {
          kind: 'p',
          text: 'How a question is phrased also changes how well it can be answered. Questions about timing and approach have real answers in this discipline. Yes-or-no questions about the future mostly do not.',
        },
        {
          kind: 'list',
          items: [
            'Rather than "will I get the job", ask "what does the next year look like for a change of role, and is there a better window in it".',
            'Rather than "will this marriage work", ask "where is the friction likely to sit, and what does the timing look like".',
            'Rather than "will I be rich", ask "which periods in the chart are the earning ones, and what should I be building during them".',
            'Bring the decision you are actually facing, even if it feels too ordinary. "Should I take the transfer to Bangalore in March" is a much better question than "tell me about my career".',
          ],
        },
        {
          kind: 'p',
          text: 'Three or four written questions is about right for a first session. If you have twenty, put them in order — the order is itself useful information about what is actually pressing.',
        },
      ],
    },
    {
      id: 'what-it-sounds-like',
      heading: 'What the session actually sounds like',
      blocks: [
        {
          kind: 'p',
          text: 'It is a conversation, not a recital. You will not be read a list of planetary positions in Sanskrit and left to interpret it. The chart is explained in plain language, with the reasoning shown — if you are told that a particular period looks demanding, you will be told which placement that comes from, so you can weigh it rather than simply absorb it.',
        },
        {
          kind: 'p',
          text: 'Sessions run in English, Hindi or Punjabi, whichever you are most comfortable thinking in. That matters more than it sounds: people describe their own lives with far more precision in their first language, and a consultation is only as good as what you are able to say in it.',
        },
        {
          kind: 'p',
          text: 'You are allowed to disagree, and it is useful when you do. If a reading of a past period does not match what actually happened, say so — it is real information, and occasionally it is the first sign that a birth time needs rectifying.',
        },
      ],
    },
    {
      id: 'what-we-will-not-do',
      heading: 'What this practice will not do',
      blocks: [
        {
          kind: 'p',
          text: 'Worth stating before you book rather than after, because these are the fears people actually arrive with.',
        },
        {
          kind: 'list',
          items: [
            'No predictions of death, terminal illness, or harm to your family. Not as a matter of taste — it is a line this practice does not cross, whoever asks.',
            'No fear-based readings. You will not be told something alarming and then offered the fix for it.',
            'No selling afterwards. No gemstones, no yantras, no pujas, no commission from anyone who supplies them. Where a traditional remedy is genuinely appropriate, you will be told what it is and left to arrange it yourself.',
            'No pressure to book again. If one session answers your question, that is the correct number of sessions.',
            'Nothing you say in a session is discussed with anyone. That includes whoever in your family paid for it.',
          ],
        },
      ],
    },
    {
      id: 'practical',
      heading: 'Practical things',
      blocks: [
        {
          kind: 'p',
          text: 'Take the call somewhere you can speak freely — the quality of a consultation drops sharply when someone is answering carefully because a relative is in the next room. Headphones help for the same reason.',
        },
        {
          kind: 'p',
          text: 'Have your birth details and your written questions in front of you rather than in another app. Bring anything you have been told previously that is worrying you, including readings from elsewhere; there is no awkwardness in reviewing someone else’s work, and that is often the most valuable ten minutes of a first session.',
        },
        {
          kind: 'p',
          text: 'Session lengths, fees and the terms for rescheduling are all on the consultation pages, which are the pages that own those facts and are kept current.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What if I do not know my exact birth time?',
      answer:
        'Book anyway. An exact time sharpens the reading, particularly around house placements, but a great deal of Vedic astrology is read from the Moon, which only changes sign every two and a quarter days. Bring whatever you have, including an approximate window such as "early morning". It is a normal situation, not a problem to be solved before booking.',
    },
    {
      question: 'What should I ask in my first astrology consultation?',
      answer:
        'Write down three or four specific questions beforehand, and phrase them around timing and approach rather than yes or no. "What does the next year look like for a change of role, and is there a better window in it" can be answered properly; "will I get the job" cannot. Bring the actual decision you are facing, however ordinary it seems.',
    },
    {
      question: 'Which language is the consultation in?',
      answer:
        'English, Hindi or Punjabi — whichever you are most comfortable thinking in. People describe their own lives with far more precision in their first language, and the session is only as good as what you are able to say in it.',
    },
    {
      question: 'Will I be told something frightening?',
      answer:
        'No. This practice does not make predictions about death, terminal illness or harm to your family, and does not give fear-based readings. If a period in your chart looks demanding you will be told plainly what it asks for and which placement that comes from, so you can weigh it yourself.',
    },
    {
      question: 'Will I be sold a gemstone or a puja afterwards?',
      answer:
        'No. This practice does not sell gemstones, yantras, pujas or protective items, and takes no commission from anyone who does. Where a traditional remedy is genuinely appropriate you will be told what it is and left to arrange it yourself.',
    },
  ],
};

/**
 * Newest first. The index renders in this order and does not sort — the order
 * of a small hand-curated list is an editorial decision, and a sort would
 * silently override it the first time a post is backdated on purpose.
 */
export const JOURNAL_POSTS: JournalPost[] = [
  SADE_SATI,
  MANGAL_DOSHA,
  FIRST_CONSULTATION,
];

export function getPostBySlug(slug: string): JournalPost | undefined {
  return JOURNAL_POSTS.find((post) => post.slug === slug);
}

/**
 * Two or three other posts, never the one being read.
 *
 * Takes from the front of the list rather than picking at random: a random
 * selection changes between the server render and nothing in particular, and
 * "related posts" that differ on every reload is a tell that they are not
 * related to anything.
 */
export function relatedPosts(slug: string, limit = 2): JournalPost[] {
  return JOURNAL_POSTS.filter((post) => post.slug !== slug).slice(0, limit);
}

/**
 * Reading time, derived rather than authored.
 *
 * A hand-written "8 min read" is a number that is correct on the day it is
 * typed and wrong after the first edit, and nobody ever remembers to update
 * it. 200 words per minute is the conventional figure for this kind of prose.
 */
export function readingMinutes(post: JournalPost): number {
  const words = post.sections
    .flatMap((section) => [
      section.heading,
      ...section.blocks.flatMap((block) => {
        switch (block.kind) {
          case 'p':
            return [block.text];
          case 'list':
            return block.items;
          case 'steps':
            return block.items.flatMap((item) => [item.title, item.text]);
          case 'callout':
            return [block.title, block.text];
          case 'tool':
            return [block.label, block.text];
        }
      }),
    ])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

/**
 * Every `/free-tools/[tool]` slug a post is allowed to link to.
 *
 * DUPLICATED FROM THE ROUTE ON PURPOSE, AND CHECKED AGAINST IT.
 *
 * Importing TOOLS out of the page file would pull a route module into a
 * content module for a list of ten strings. Instead the list is restated here
 * and the assertion below runs at module load, so a `tool` block pointing at a
 * calculator that does not exist fails the build that introduces it rather
 * than shipping a 404 inside an article whose entire job is to be trustworthy.
 */
const TOOL_SLUGS = [
  'free-kundli',
  'panchang',
  'moon-sign',
  'lagna',
  'nakshatra',
  'numerology',
  'mangal-dosha',
  'kaal-sarp',
  'sade-sati',
  'kundli-matching',
] as const;

for (const post of JOURNAL_POSTS) {
  for (const section of post.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'tool' && !TOOL_SLUGS.includes(block.slug as (typeof TOOL_SLUGS)[number])) {
        throw new Error(
          `journal: post "${post.slug}" links to unknown free tool "${block.slug}". ` +
            `Valid slugs: ${TOOL_SLUGS.join(', ')}`,
        );
      }
    }
  }
}
