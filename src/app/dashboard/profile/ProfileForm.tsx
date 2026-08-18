'use client';

import { useActionState, useState } from 'react';
import { Lock } from 'lucide-react';
import { updateProfile, type ActionState } from '@/app/dashboard/actions';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import type { Profile } from '@/types/database';

/**
 * Profile form.
 *
 * Birth information is visually and semantically separated from contact
 * details, with an explicit statement of who can see it. This is the most
 * sensitive data a client gives us, and burying it in an undifferentiated form
 * would be careless with something people are genuinely private about.
 *
 * Note there is no role field, and no way to add one — role is not writable
 * through the API at all (database/03_profiles.sql).
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, null);
  const [timeKnown, setTimeKnown] = useState(profile.birth_time_known);

  return (
    <form action={action} className="space-y-8">
      {state?.error && <InlineAlert tone="danger">{state.error}</InlineAlert>}
      {state?.success && <InlineAlert tone="success">{state.success}</InlineAlert>}

      <fieldset className="space-y-5">
        <legend className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
          Contact details
        </legend>

        <Field label="Full name" htmlFor="p-name" required>
          <Input name="fullName" defaultValue={profile.full_name ?? ''} autoComplete="name" required />
        </Field>

        <Field label="Email" htmlFor="p-email" hint="Contact us if you need to change the email on your account.">
          <Input id="p-email" defaultValue={profile.email} disabled />
        </Field>

        <Field label="Phone" htmlFor="p-phone">
          <Input name="phone" type="tel" inputMode="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" />
        </Field>
      </fieldset>

      <fieldset className="space-y-5  border border-[var(--color-outline-variant)] bg-white p-5">
        <legend className="px-1.5 font-sans text-sm font-semibold">Birth details</legend>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-body-warm)]">
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
          Private. Visible only to you and Komal, used only to prepare your consultations.
          Never shared, sold or used for marketing.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="p-bdate">
            <Input name="birthDate" type="date" defaultValue={profile.birth_date ?? ''} />
          </Field>
          <Field label="Time of birth" htmlFor="p-btime">
            <Input
              name="birthTime"
              type="time"
              defaultValue={profile.birth_time?.slice(0, 5) ?? ''}
              disabled={!timeKnown}
            />
          </Field>
        </div>

        <Checkbox
          id="p-timeknown"
          name="birthTimeKnown"
          label="I know my exact birth time"
          checked={timeKnown}
          onChange={(e) => setTimeKnown(e.target.checked)}
        />

        <Field label="Place of birth" htmlFor="p-bplace">
          <Input name="birthPlace" defaultValue={profile.birth_place ?? ''} placeholder="City, state or country" />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="sr-only">Preferences</legend>
        <Checkbox
          id="p-marketing"
          name="marketingOptIn"
          defaultChecked={profile.marketing_opt_in}
          label="Send me occasional updates about new services and availability. You can turn this off at any time."
        />
      </fieldset>

      <Button type="submit" size="lg" loading={pending} loadingText="Saving…">
        Save changes
      </Button>
    </form>
  );
}
