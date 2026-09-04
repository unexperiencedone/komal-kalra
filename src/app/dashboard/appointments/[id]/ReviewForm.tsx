'use client';

import { useActionState, useState } from 'react';
import { Star } from 'lucide-react';
import { submitTestimonial, type ActionState } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/states';

/**
 * Leave a review for a completed session.
 *
 * WHY THIS EXISTS AT ALL
 *
 * The database has permitted client reviews since day one —
 * `testimonials_insert_own_completed` verifies the caller owns a COMPLETED
 * appointment — and /admin/testimonials told Komal in as many words that
 * "clients can leave a review after a completed session". Nothing in the app
 * ever called it. The policy, the moderation queue and the display components
 * all existed with no way to put a review into them, which is why the site has
 * no testimonials rather than merely few.
 *
 * NOTHING HERE IS SOCIAL PROOF UNTIL KOMAL SAYS SO. Every submission lands
 * `approved = false`; the homepage renders no testimonial section at all while
 * there are no approved rows, and there has never been placeholder review
 * content to fall back on. That is the rule the original brief set and it is
 * unchanged — this only supplies the real thing.
 */

const RATINGS = [1, 2, 3, 4, 5] as const;

export function ReviewForm({
  appointmentId,
  defaultName,
}: {
  appointmentId: string;
  defaultName: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitTestimonial, null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state?.success) {
    return (
      <div className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6">
        <InlineAlert tone="success">{state.success}</InlineAlert>
      </div>
    );
  }

  return (
    <form action={action} className="border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      {/*
        The star widget is presentational; this is the value that is submitted
        and validated. Without it a JavaScript failure would post no rating at
        all, and the schema would reject the whole review rather than the form
        degrading to something usable.
      */}
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm leading-relaxed text-[var(--color-body-warm)]">
        How was your session? Astrologer Komal Kalra reads every review before anything appears on the site.
      </p>

      {/* --- Rating ---------------------------------------------------- */}
      <fieldset className="mt-6">
        <legend className="label-caps text-[var(--color-cocoa)]">Your rating</legend>
        <div className="mt-3 flex gap-1" onMouseLeave={() => setHovered(0)}>
          {RATINGS.map((value) => {
            const filled = value <= (hovered || rating);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(0)}
                /*
                  Real buttons with real accessible names, not a row of icons.
                  aria-pressed communicates the current choice to a screen
                  reader, which a purely visual fill does not.
                */
                aria-pressed={value === rating}
                aria-label={`${value} out of 5`}
                className="p-1 transition-transform hover:scale-110 motion-reduce:transition-none"
              >
                <Star
                  aria-hidden
                  className={
                    filled
                      ? 'size-7 fill-[var(--color-saffron)] text-[var(--color-saffron-deep)]'
                      : 'size-7 text-[var(--color-hairline)]'
                  }
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* --- Review ---------------------------------------------------- */}
      <div className="mt-6">
        <Field
          label="Your review"
          htmlFor="review"
          required
          hint="A sentence or two is plenty. What did the session help you with?"
        >
          <Textarea id="review" name="review" rows={5} minLength={20} maxLength={1500} required />
        </Field>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Name to show" htmlFor="authorName" required>
          <Input id="authorName" name="authorName" defaultValue={defaultName} required />
        </Field>
        <Field label="City (optional)" htmlFor="authorLocation">
          <Input id="authorLocation" name="authorLocation" placeholder="e.g. Kanpur" />
        </Field>
      </div>

      {/*
        Offered prominently rather than hidden in small print. Astrological
        consultations are private for a lot of people — someone may be glad to
        recommend Astrologer Komal Kalra and still not want their full name beside a review of a
        session about their marriage. Making them hunt for this option is how
        you lose the review entirely.
      */}
      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-[var(--color-body-warm)]">
        <input
          type="checkbox"
          name="displayInitialsOnly"
          className="mt-1 accent-[var(--color-saffron-deep)]"
        />
        <span>Show only my initials. Your full name is never published if you tick this.</span>
      </label>

      {state?.error && (
        <div className="mt-6">
          <InlineAlert tone="danger">{state.error}</InlineAlert>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        variant="primary"
        disabled={rating === 0 || pending}
        loading={pending}
        loadingText="Sending…"
        className="mt-8 w-full md:w-auto"
      >
        Send review
      </Button>
    </form>
  );
}
