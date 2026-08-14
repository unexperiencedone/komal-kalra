import { BRAND, POLICY } from '@/lib/config';

/**
 * Legal content.
 *
 * IMPORTANT — READ BEFORE LAUNCH
 * These are working drafts written to be accurate about how this specific
 * system actually behaves (what data is collected, how refunds are processed,
 * what the cancellation windows are). They are NOT legal advice and have not
 * been reviewed by a lawyer.
 *
 * Razorpay requires a live merchant account to have published terms, privacy
 * and refund policies, so shipping placeholders here would block activation.
 * These are written to satisfy that requirement honestly, but they should be
 * reviewed by an Indian legal professional — particularly the DPDP Act
 * obligations around personal data — before the site goes live.
 */

export const LAST_UPDATED = 'August 2026';

export function TermsContent() {
  return (
    <>
      <p>
        These terms govern your use of this website and any consultation you book through it.
        By booking a session you agree to them.
      </p>

      <h2>Who we are</h2>
      <p>
        {BRAND.fullName}, an independent consultation practice contactable on{' '}
        {BRAND.phones[0]} and at {BRAND.email}.
      </p>

      <h2>What we provide</h2>
      <p>
        One-to-one consultations in astrology, coaching, healing and counselling. Sessions are
        for guidance and personal reflection. They are <strong>not</strong> a substitute for
        medical, psychological, legal, financial or investment advice. No outcome is
        guaranteed, and no consultation should be treated as a prediction of fact.
      </p>
      <p>
        If you are experiencing a medical or mental-health crisis, please contact a qualified
        professional or your local emergency service rather than booking a session.
      </p>

      <h2>Booking and payment</h2>
      <ul>
        <li>Prices shown include all applicable taxes. Nothing is added at checkout.</li>
        <li>
          A booking is confirmed only once payment has been received and verified. Selecting a
          time reserves it temporarily but does not confirm it.
        </li>
        <li>
          Payments are processed by Razorpay. We do not receive, see or store your card, UPI
          or bank credentials at any point.
        </li>
        <li>
          You must be 18 or over to book. Sessions concerning a minor may be booked by a
          parent or guardian.
        </li>
      </ul>

      <h2>Attending your session</h2>
      <p>
        Joining details are sent to the email address on your booking. If you cannot attend at
        the agreed time, the cancellation and rescheduling terms below apply. If you do not
        attend and have not told us, the session is treated as delivered and the fee is not
        refundable.
      </p>
      <p>
        If Komal is unable to attend for any reason, you will be offered a new time or a full
        refund, whichever you prefer.
      </p>

      <h2>Your conduct</h2>
      <p>
        Sessions are a mutually respectful space. We reserve the right to end a session and
        decline future bookings in cases of abusive behaviour, without refund.
      </p>

      <h2>Recording</h2>
      <p>
        Please do not record a session without asking first. Sessions are confidential in both
        directions.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, our total liability in connection with any
        consultation is limited to the amount you paid for that consultation. Decisions you
        take after a session are your own.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version that applies to your booking is the one
        published at the time you booked.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts of India have exclusive
        jurisdiction over any dispute.
      </p>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <p>
        This policy explains what personal information we collect, why, and what we do with
        it. It describes how this website actually works rather than covering hypotheticals.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and phone number.</li>
        <li>
          <strong>Birth information:</strong> date, time and place of birth, where you choose
          to provide it. This is optional and is used only to prepare your consultation.
        </li>
        <li>
          <strong>Booking information:</strong> the service, date and time you booked, and
          anything you write in the &ldquo;what would you like to discuss&rdquo; field.
        </li>
        <li>
          <strong>Payment records:</strong> the amount, status, payment method type and the
          transaction reference issued by Razorpay. <strong>We never receive or store your
          card number, UPI PIN or bank credentials</strong> — those are handled entirely
          within Razorpay&apos;s systems.
        </li>
        <li>
          <strong>Enquiries:</strong> anything you send through the contact form.
        </li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your personal information to anyone, ever.</li>
        <li>We do not share your birth details or consultation content with third parties.</li>
        <li>
          We do not run advertising trackers or third-party analytics pixels on this site.
        </li>
      </ul>

      <h2>Who can see your information</h2>
      <p>
        Your birth details, your questions and anything discussed in a session are visible
        only to you and to Komal. Notes made during a consultation are private to Komal and
        are never shown to anyone else.
      </p>

      <h2>Service providers we rely on</h2>
      <ul>
        <li><strong>Supabase</strong> — database and authentication hosting.</li>
        <li><strong>Razorpay</strong> — payment processing (PCI-DSS compliant).</li>
        <li><strong>Our email provider</strong> — sending booking confirmations and reminders.</li>
      </ul>
      <p>
        Each receives only what it needs to do its job, and each is bound by its own data
        protection obligations.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Booking and payment records are retained for as long as required by Indian tax and
        accounting law. Consultation notes and birth details are kept while your account is
        active. You can ask us to delete them at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct or delete your personal information. Most of it is editable
        yourself from your dashboard; for anything else, email {BRAND.email} or call{' '}
        {BRAND.phones[0]} and we will action it.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit. Access is restricted at the database level so that one
        client&apos;s records cannot be read by another. Administrative actions that affect
        money or bookings are logged.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: {BRAND.email} or {BRAND.phones[0]}.
      </p>
    </>
  );
}

export function RefundContent() {
  return (
    <>
      <p>
        We would rather you rescheduled than lost your money, so this policy is written to be
        easy to use. If your situation is not covered here, call us — we are reasonable.
      </p>

      <h2>Cancelling</h2>
      <ul>
        <li>
          <strong>More than 24 hours before your session:</strong> cancel free of charge and
          receive a full refund.
        </li>
        <li>
          <strong>Within 24 hours of your session:</strong> the fee is non-refundable, because
          the time has been held for you and can no longer be offered to someone else. You may
          still reschedule once instead — see below.
        </li>
      </ul>
      <p>
        You can cancel yourself from your dashboard, or call us and we will do it for you.
      </p>

      <h2>Rescheduling</h2>
      <p>{POLICY.rescheduleSummary}</p>

      <h2>If you do not attend</h2>
      <p>
        If you do not join your session and have not contacted us, it is treated as delivered
        and the fee is not refundable. If something went wrong on the day, call us — this is
        applied with common sense, not rigidly.
      </p>

      <h2>If we cancel</h2>
      <p>
        If Komal has to cancel or move a session for any reason, you will be offered a new
        time or a full refund, whichever you prefer. This applies regardless of how close to
        the session it happens.
      </p>

      <h2>If a payment succeeds but the booking does not</h2>
      <p>
        Very occasionally a payment completes at the same moment someone else takes the last
        slot. If that happens, your money is never kept: we will contact you immediately to
        arrange another time, or refund you in full the same day. Which one happens is
        entirely your choice.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        {POLICY.refundTiming} Refunds are always returned to the original payment method —
        the card, UPI ID or account you paid from. This is a payment industry requirement and
        we cannot send a refund anywhere else.
      </p>

      <h2>Failed payments</h2>
      <p>
        If a payment fails, nothing is charged and the slot is released. If money appears to
        have left your account for a failed booking, it is an authorisation that will be
        released by your bank automatically, usually within 5–7 working days. Call us if it
        does not.
      </p>

      <h2>Questions</h2>
      <p>
        Call {BRAND.phones[0]} or email {BRAND.email} quoting your booking reference.
      </p>
    </>
  );
}
