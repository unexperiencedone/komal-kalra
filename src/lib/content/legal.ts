import { BRAND, POLICY } from '@/lib/config';

/**
 * Legal documents — single source of truth.
 *
 * ⚠️  NOT LEGAL ADVICE. These are working drafts written to be ACCURATE about
 * how this specific system behaves — what it collects, who processes it, how
 * refunds actually work. They have not been reviewed by a lawyer and should be
 * before launch. See docs/legal-compliance.md.
 *
 * WHY STRUCTURED DATA RATHER THAN JSX
 *
 * These documents have to exist in two places: rendered on the site, and as
 * markdown in docs/legal/ for the record. Written as JSX they would need
 * hand-copying into markdown, and the two would drift the first time a clause
 * changed. Here the page renders this array and `npm run legal:export` writes
 * the markdown from the same array, so they cannot disagree.
 *
 * WHAT DRIVES THE CONTENT
 *
 * 1. India's DPDP Act 2023 (Rules 2025). Full substantive compliance lands
 *    13 May 2027, but the notice requirements are the shape a privacy policy
 *    should already take: what is collected, why, how to exercise rights, how
 *    to complain to the Data Protection Board.
 * 2. Razorpay merchant activation, which runs an automated check for Terms,
 *    Privacy, Cancellation/Refunds, Contact, Pricing and a Shipping/Delivery
 *    policy — hence /legal/delivery, which exists to say "nothing is shipped".
 * 3. Google OAuth consent screen, which requires public privacy and terms URLs.
 * 4. IT Act intermediary rules, which require a named grievance officer with
 *    published contact details and a response timeline.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'definitions'; items: { term: string; text: string }[] };

export interface LegalSection {
  heading: string;
  blocks: Block[];
}

export interface LegalDocument {
  slug: 'terms' | 'privacy' | 'refunds' | 'delivery';
  title: string;
  /** Used for <title> and the meta description. */
  description: string;
  /** Shown under the H1. */
  standfirst: string;
  sections: LegalSection[];
}

/** Bump when any document changes materially. Shown on every page. */
export const LEGAL_LAST_UPDATED = 'August 2026';

/**
 * Grievance officer — required under the IT Rules and named in the DPDP
 * privacy notice as the route for data-principal requests.
 *
 * PLACEHOLDER: replace `name` with the real individual before launch. Under the
 * IT Rules this must be a named natural person, not a role or a shared inbox.
 */
export const GRIEVANCE_OFFICER = {
  name: 'Astrologer Komal Kalra',
  designation: 'Grievance Officer',
  email: BRAND.email,
  phone: BRAND.phones[0],
  responseWindow: '48 hours',
  resolutionWindow: '30 days',
} as const;

const p = (text: string): Block => ({ type: 'p', text });
const list = (...items: string[]): Block => ({ type: 'list', items });

// ---------------------------------------------------------------------------
// PRIVACY POLICY
// ---------------------------------------------------------------------------
const PRIVACY: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  description:
    'What personal information Astrologer Komal Kalra collects, why, who processes it, how long it is kept, and how to exercise your rights under the DPDP Act.',
  standfirst:
    'This notice explains what personal data we collect, why we collect it, and what you can do about it. It describes how this website actually works rather than covering hypotheticals.',
  sections: [
    {
      heading: 'Who we are',
      blocks: [
        p(`${BRAND.fullName} ("we", "us") is an independent consultation practice operating this website. For the purposes of India's Digital Personal Data Protection Act, 2023, we are the Data Fiduciary for the personal data described below, and you are the Data Principal.`),
        p(`Contact: ${BRAND.email} · ${BRAND.phones[0]}`),
      ],
    },
    {
      heading: 'What we collect, and why',
      blocks: [
        p('We collect only what a consultation booking actually requires. Each category below states its purpose, which is the basis on which you are asked to provide it.'),
        {
          type: 'definitions',
          items: [
            {
              term: 'Account details — name, email address, phone number',
              text: 'To create your account, confirm your booking, send your joining link and reminders, and contact you if something changes.',
            },
            {
              term: 'Birth information — date, time and place of birth',
              text: 'Optional. Used solely to prepare your consultation. You may decline to provide it, or provide only part of it, and still book. If you do not know your birth time you can say so, and the session proceeds.',
            },
            {
              term: 'Consultation content — the question you submit when booking, and notes taken during a session',
              text: 'To prepare for and conduct your consultation, and to give continuity if you book again.',
            },
            {
              term: 'Payment records — amount, status, method type, and the transaction reference issued by Razorpay',
              text: 'To confirm your booking, issue receipts, process refunds, and meet tax and accounting obligations.',
            },
            {
              term: 'Enquiries — anything you send through the contact form',
              text: 'To reply to you. If you abandon a booking after entering your details, we retain those details as an enquiry so we can follow up.',
            },
            {
              term: 'Technical data — IP address for rate limiting, and session cookies',
              text: 'To keep you signed in and to prevent abuse of the booking and contact forms.',
            },
          ],
        },
      ],
    },
    {
      heading: 'What we never do',
      blocks: [
        list(
          'We do not sell your personal data to anyone, under any circumstances.',
          'We do not share your birth details or consultation content with third parties.',
          'We do not run advertising trackers, third-party analytics pixels, or profiling of any kind on this site.',
          'We do not use your data to train any automated system.',
          'We never see or store your card number, UPI PIN, CVV or bank credentials. Those are entered on Razorpay’s secure checkout and never reach our servers.',
        ),
      ],
    },
    {
      heading: 'Cookies',
      blocks: [
        p('This site sets only what it needs to function. There are no advertising or analytics cookies, which is why you are not asked to dismiss a consent banner.'),
        list(
          'Authentication cookies — keep you signed in. Set by Supabase, our authentication provider. Removing them signs you out.',
          'A short-lived booking session cookie — lets your own held time slot stay visible to you while you complete checkout. It expires within hours and identifies a browser session, not a person.',
        ),
      ],
    },
    {
      heading: 'Who else processes your data',
      blocks: [
        p('We use a small number of service providers, each receiving only what it needs to do its job and each bound by its own data protection obligations.'),
        {
          type: 'definitions',
          items: [
            { term: 'Supabase', text: 'Database hosting and authentication. Stores your account, bookings and payment records.' },
            { term: 'Razorpay', text: 'Payment processing. PCI-DSS compliant. Receives your name, email, phone and the amount payable; handles your payment credentials entirely within its own systems.' },
            { term: 'Google', text: 'Only if you choose to sign in with Google. We receive your name, email address and profile picture. We do not receive your Google password or access anything else in your Google account.' },
            { term: 'Our email provider', text: 'Sends booking confirmations, reminders and receipts.' },
          ],
        },
      ],
    },
    {
      heading: 'How long we keep it',
      blocks: [
        list(
          'Booking and payment records — retained as long as Indian tax and accounting law requires.',
          'Consultation notes and birth details — kept while your account is active, so a repeat session has context. Deleted on request.',
          'Enquiries — kept while we follow up, then periodically cleared.',
          'Payment provider event logs — retained for reconciliation and audit, with payload contents pruned after twelve months.',
        ),
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        p('Under the DPDP Act you have the right to access a summary of your personal data and how it is processed, to have it corrected or completed, to have it erased, to nominate someone to exercise these rights if you are unable to, and to a grievance redressal process.'),
        p('Most of this is self-service: sign in and open your dashboard to view your bookings and payments, and your profile to correct or remove your details, including your birth information. For anything else — erasure of your whole account, a copy of your data, or withdrawal of consent — contact the Grievance Officer below and we will action it.'),
        p('Withdrawing consent is always available to you. Note that we may still need to retain payment and booking records where law requires it, and that withdrawing consent for the data a consultation depends on may mean we cannot deliver the session.'),
      ],
    },
    {
      heading: 'Grievance Officer',
      blocks: [
        p(`In accordance with the Information Technology Act, 2000 and the rules made under it, and as the contact point for data protection requests:`),
        list(
          `Name: ${GRIEVANCE_OFFICER.name}`,
          `Designation: ${GRIEVANCE_OFFICER.designation}`,
          `Email: ${GRIEVANCE_OFFICER.email}`,
          `Phone: ${GRIEVANCE_OFFICER.phone}`,
        ),
        p(`We acknowledge complaints within ${GRIEVANCE_OFFICER.responseWindow} and aim to resolve them within ${GRIEVANCE_OFFICER.resolutionWindow}.`),
        p('If you are not satisfied with our response, you may complain to the Data Protection Board of India.'),
      ],
    },
    {
      heading: 'Children',
      blocks: [
        p('This service is not directed at children. You must be 18 or over to create an account or make a booking. A parent or guardian may book a consultation concerning a minor, in which case they provide the minor’s details and are responsible for that consent.'),
      ],
    },
    {
      heading: 'Security',
      blocks: [
        p('Data is encrypted in transit. Access is restricted at the database level so one client’s records cannot be read by another. Administrative actions affecting money or bookings are logged with the account that performed them.'),
        p('No system is perfectly secure. If a breach affecting your personal data occurs, we will notify you and the Data Protection Board as required.'),
      ],
    },
    {
      heading: 'Changes to this notice',
      blocks: [
        p('If we change how we handle personal data we will update this page and its revision date. Where a change is material we will tell account holders directly rather than relying on you to notice.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// TERMS OF SERVICE
// ---------------------------------------------------------------------------
const TERMS: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  description: `The terms that apply to consultations booked with ${BRAND.fullName}.`,
  standfirst:
    'These terms govern your use of this website and any consultation you book through it. By booking a session you agree to them.',
  sections: [
    {
      heading: 'Who we are',
      blocks: [
        p(`${BRAND.fullName}, an independent consultation practice contactable on ${BRAND.phones[0]} and at ${BRAND.email}.`),
      ],
    },
    {
      heading: 'What we provide',
      blocks: [
        p('One-to-one consultations in astrology, coaching, healing and counselling, delivered remotely unless otherwise agreed.'),
        p('Sessions are for guidance and personal reflection. They are NOT a substitute for medical, psychological, psychiatric, legal, financial or investment advice. No outcome is guaranteed, and nothing said in a consultation should be treated as a prediction of fact or as professional advice in a regulated field.'),
        p('If you are experiencing a medical or mental-health crisis, contact a qualified professional or your local emergency service rather than booking a session.'),
      ],
    },
    {
      heading: 'Eligibility',
      blocks: [
        p('You must be 18 or over to create an account or book. Sessions concerning a minor may be booked by a parent or guardian, who accepts these terms on the minor’s behalf.'),
        p('You agree that the information you give us — including your name, contact details and any birth information — is accurate and yours to provide.'),
      ],
    },
    {
      heading: 'Booking and payment',
      blocks: [
        list(
          'Prices shown are in Indian Rupees and include all applicable taxes. Nothing is added at checkout.',
          'Selecting a time reserves it temporarily. A booking is confirmed only once payment has been received and verified.',
          'Payments are processed by Razorpay. We do not receive, see or store your card, UPI or bank credentials at any point.',
          'If a payment succeeds but the time slot cannot be secured, we will contact you to arrange an alternative or refund you in full — your choice. We never retain payment for a session that does not exist.',
        ),
      ],
    },
    {
      heading: 'Attending your session',
      blocks: [
        p('Joining details are sent to the email address on your booking. Please be ready at the agreed time; sessions run to the booked duration and a late start does not extend the end time.'),
        p('If you do not attend and have not contacted us, the session is treated as delivered and the fee is not refundable. If something genuinely went wrong on the day, contact us — this is applied with common sense.'),
        p('If we are unable to attend for any reason, you will be offered a new time or a full refund, whichever you prefer.'),
      ],
    },
    {
      heading: 'Cancellation and refunds',
      blocks: [
        p(POLICY.cancellationSummary),
        p('The full policy, including how refunds are paid and what happens to failed payments, is set out on the Cancellation & Refunds page.'),
      ],
    },
    {
      heading: 'Your conduct',
      blocks: [
        p('Sessions are a mutually respectful space. We may end a session and decline future bookings in cases of abusive behaviour, without refund.'),
        p('You agree not to misuse this website — no attempting to access other users’ data, no automated scraping, no interference with the booking or payment systems.'),
      ],
    },
    {
      heading: 'Recording and confidentiality',
      blocks: [
        p('Please do not record a session without asking first. Sessions are confidential in both directions: we do not disclose what is discussed, and we ask the same of you regarding any material shared with you.'),
      ],
    },
    {
      heading: 'Intellectual property',
      blocks: [
        p('The content of this website — text, photography, and any written summary provided after a session — remains our property. A written summary is provided for your personal use; please do not republish it.'),
      ],
    },
    {
      heading: 'Limitation of liability',
      blocks: [
        p('To the fullest extent permitted by law, our total liability in connection with any consultation is limited to the amount you paid for that consultation.'),
        p('Decisions you take following a session are your own. We are not liable for any loss arising from action taken on the basis of a consultation, and nothing in these terms excludes liability that cannot lawfully be excluded.'),
      ],
    },
    {
      heading: 'Changes to these terms',
      blocks: [
        p('We may update these terms. The version that applies to your booking is the one published at the time you booked.'),
      ],
    },
    {
      heading: 'Governing law and grievances',
      blocks: [
        p('These terms are governed by the laws of India, and the courts of India have exclusive jurisdiction over any dispute.'),
        p(`For complaints, contact ${GRIEVANCE_OFFICER.name}, ${GRIEVANCE_OFFICER.designation}, at ${GRIEVANCE_OFFICER.email} or ${GRIEVANCE_OFFICER.phone}. We acknowledge within ${GRIEVANCE_OFFICER.responseWindow} and aim to resolve within ${GRIEVANCE_OFFICER.resolutionWindow}.`),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// CANCELLATION & REFUNDS
// ---------------------------------------------------------------------------
const REFUNDS: LegalDocument = {
  slug: 'refunds',
  title: 'Cancellation & Refunds',
  description: 'How cancellation, rescheduling and refunds work for consultations.',
  standfirst:
    'Bookings are final. Please read this before you pay, because it is short and it matters: a paid session cannot be cancelled and the fee is not refundable if you change your mind. You may move your session once, by calling us.',
  sections: [
    {
      heading: 'Bookings are final',
      blocks: [
        p('Once a consultation is paid for it cannot be cancelled, and the fee is not refundable if you decide not to attend or change your mind.'),
        p('The reason is simply how the practice works: the time is taken out of Astrologer Komal Kalra’s calendar and held for you alone, the chart is read in advance of the session, and the slot cannot be offered to anyone else. That preparation happens whether or not you arrive.'),
        p('This is stated on the booking page and you confirm it before paying. If you are unsure whether a consultation is right for you, call before booking rather than after — we would far rather answer that question first.'),
      ],
    },
    {
      heading: 'Moving your session',
      blocks: [
        p(POLICY.rescheduleSummary),
        list(
          'A session may be moved once.',
          'It is arranged by telephone, not from the website, so a new time can be agreed with Astrologer Komal Kalra directly rather than guessed at from a calendar.',
          'There is no charge for moving a session.',
          'Once a session has been moved once, the new time is final.',
        ),
      ],
    },
    {
      heading: 'If you do not attend',
      blocks: [
        p('If you do not join your session and have not contacted us beforehand, it is treated as delivered and the fee is not refundable.'),
        p('If something genuinely went wrong on the day, call us. This is applied with common sense rather than rigidly.'),
      ],
    },
    {
      // This section is NOT optional and must not be weakened to "no refunds
      // under any circumstances". Keeping payment for a service that was never
      // provided is not a strict policy — under India's Consumer Protection Act
      // 2019 it is the kind of term that gets read as unfair, and a clause
      // struck out for unfairness can take the enforceable parts of the policy
      // with it. It is also simply wrong.
      heading: 'When you ARE refunded',
      blocks: [
        p('The policy above covers you changing your mind. It does not cover us failing to deliver. In each of the following, you are refunded in full:'),
        list(
          'Astrologer Komal Kalra has to cancel or is unable to hold the session, for any reason.',
          'A session cannot go ahead because of a fault on our side.',
          'A payment succeeds but the booking does not complete — see below.',
          'You were charged more than once for the same booking.',
        ),
        p('Where we cancel, you are offered a new time or a full refund, whichever you prefer. That choice is yours, and it applies however close to the session it happens.'),
      ],
    },
    {
      heading: 'If a payment succeeds but the booking does not',
      blocks: [
        p('Very occasionally a payment completes at the same moment someone else takes the last slot. If that happens your money is never kept: we will contact you to arrange another time, or refund you in full the same day. Which one happens is entirely your choice.'),
      ],
    },
    {
      heading: 'How refunds are paid',
      blocks: [
        p(POLICY.refundTiming),
        p('Refunds are always returned to the original payment method — the card, UPI ID or account you paid from. This is a payment industry requirement and we cannot send a refund anywhere else.'),
        p('Approved refunds are initiated within 3 working days. The time it then takes to appear depends on your bank or card issuer.'),
      ],
    },
    {
      heading: 'Failed payments',
      blocks: [
        p('If a payment fails, nothing is charged and the slot is released. If money appears to have left your account for a failed booking, it is an authorisation that your bank will release automatically, usually within 5–7 working days. Call us if it does not.'),
      ],
    },
    {
      heading: 'Questions',
      blocks: [
        p(`Call ${BRAND.phones[0]} or email ${BRAND.email} quoting your booking reference. Refund queries are acknowledged within ${GRIEVANCE_OFFICER.responseWindow}.`),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// SERVICE DELIVERY  (Razorpay's "shipping policy" equivalent)
// ---------------------------------------------------------------------------
const DELIVERY: LegalDocument = {
  slug: 'delivery',
  title: 'Service Delivery',
  description:
    'How consultations are delivered. No physical goods are shipped — all services are provided remotely at a scheduled time.',
  standfirst:
    'This practice sells scheduled consultations, not physical products. Nothing is posted or shipped. This page exists so the delivery terms are stated plainly, and because payment providers require it.',
  sections: [
    {
      heading: 'No physical goods',
      blocks: [
        p('We do not sell, dispatch or ship any physical product. There are no shipping charges, no delivery addresses and no courier tracking, because there is nothing to send.'),
      ],
    },
    {
      heading: 'How a consultation is delivered',
      blocks: [
        list(
          'Sessions are held over a secure video link unless you have booked a telephone or in-person consultation.',
          'Your joining details are emailed to the address on your booking, before the session.',
          'A reminder is sent 24 hours ahead.',
          'Where a written summary forms part of the service, it is emailed after the session.',
        ),
      ],
    },
    {
      heading: 'When delivery happens',
      blocks: [
        p('At the date and time you selected when booking, shown to you in India Standard Time (IST) throughout the booking flow and on your confirmation.'),
        p('Booking confirmation is immediate: as soon as your payment is verified, the appointment appears in your dashboard and a confirmation email is issued. The consultation itself is delivered at the scheduled time.'),
      ],
    },
    {
      heading: 'If you do not receive your joining details',
      blocks: [
        p(`Check your spam folder first, then contact us on ${BRAND.phones[0]} or ${BRAND.email}. Your booking reference is in your dashboard. We will resend the details immediately — a missing email is never a reason to lose a session.`),
      ],
    },
    {
      heading: 'Territory',
      blocks: [
        p('Consultations are delivered remotely and can be attended from anywhere. Pricing is in Indian Rupees and scheduling is in India Standard Time.'),
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocument['slug'], LegalDocument> = {
  privacy: PRIVACY,
  terms: TERMS,
  refunds: REFUNDS,
  delivery: DELIVERY,
};

export const LEGAL_INDEX = [TERMS, PRIVACY, REFUNDS, DELIVERY] as const;
