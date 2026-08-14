import type { FaqItem } from '@/components/marketing/FaqAccordion';
import { POLICY } from '@/lib/config';

/**
 * FAQ content.
 *
 * Chosen by what actually blocks a booking rather than what is interesting to
 * write. Conversion research names unclear cancellation terms and payment
 * uncertainty as top friction points, so those come first — before anything
 * about astrology itself (docs/research.md §3.1).
 *
 * These also feed FAQPage structured data, so each answer is written to be
 * useful standing alone in a search result.
 */
export const BOOKING_FAQ: FaqItem[] = [
  {
    question: 'How do I book a consultation?',
    answer:
      'Choose a service, pick a time from the calendar, enter your details and pay online. Your slot is held while you complete payment, and you receive a confirmation with the joining details as soon as the payment goes through. The whole process takes about two minutes.',
  },
  {
    question: 'Can I cancel or reschedule?',
    answer: `${POLICY.cancellationSummary} ${POLICY.rescheduleSummary} You can do both yourself from your dashboard, or call us and we will take care of it.`,
  },
  {
    question: 'How do refunds work?',
    answer: `${POLICY.refundTiming} Refunds go back to the card, UPI ID or account you paid from — we cannot send them anywhere else, which is a payment industry rule rather than our own.`,
  },
  {
    question: 'Is online payment safe?',
    answer:
      'Yes. Payments are handled entirely by Razorpay, a PCI-DSS compliant payment gateway. Your card or UPI details are entered on their secure checkout and never touch our servers — we only ever see whether a payment succeeded and for how much.',
  },
  {
    question: 'What if I do not know my exact birth time?',
    answer:
      'That is very common and it is not a problem. Tell us what you do know — even the approximate part of the day helps — and mark the "I am not sure of the time" option when you book. Komal will work with what is available and will tell you honestly if a particular reading needs a more precise time.',
  },
  {
    question: 'How does the consultation actually happen?',
    answer:
      'Most sessions are held over a video call. You will receive a joining link before your appointment. Find somewhere quiet where you will not be interrupted, and have any details you want to discuss to hand.',
  },
  {
    question: 'Will my information stay private?',
    answer:
      'Yes. Your birth details, your questions and anything discussed in a session are confidential. They are visible only to Komal and are never shared, sold or used for marketing.',
  },
  {
    question: 'What if I want to talk to someone before booking?',
    answer:
      'Call either of the numbers on this page, or send a message through the contact form. Komal reads every enquiry personally. If a consultation is not the right fit for what you need, she will say so.',
  },
];
