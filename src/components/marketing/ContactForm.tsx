'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Send } from 'lucide-react';
import { contactSchema, type ContactInput } from '@/lib/validation/schemas';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/states';
import type { Service } from '@/types/database';

/**
 * Contact / lead capture.
 *
 * Seven fields is the documented sweet spot for an optimised form; this has
 * four, one of which is optional. Either an email or a phone number is required
 * but not both — insisting on both measurably reduces submissions and a solo
 * practitioner only needs one way to reply.
 *
 * The `website` field is a honeypot: hidden from humans, filled by bots.
 * Validation runs through the same Zod schema the server uses, so the two can
 * never drift apart.
 */
export function ContactForm({ services = [] }: { services?: Service[] }) {
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '', serviceId: '', website: '' },
  });

  async function onSubmit(values: ContactInput) {
    setState('idle');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        setErrorMessage(json.message ?? 'We could not send that. Please try calling us instead.');
        setState('error');
        return;
      }
      reset();
      setState('sent');
    } catch {
      setErrorMessage('Your message did not send. Please check your connection, or call us.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-[var(--color-success)]/25 bg-[var(--color-success-container)] p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--color-success)]">
          <Check className="size-5 text-white" aria-hidden />
        </div>
        <p className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold">Message sent</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
          Thank you. Komal reads every enquiry personally and will come back to you shortly.
        </p>
        <Button variant="ghost" size="sm" className="mt-5" onClick={() => setState('idle')}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {state === 'error' && <InlineAlert tone="danger" title="Could not send">{errorMessage}</InlineAlert>}

      <Field label="Your name" htmlFor="contact-name" required error={errors.name?.message}>
        <Input {...register('name')} autoComplete="name" placeholder="Full name" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="contact-email" error={errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" inputMode="email" />
        </Field>
        <Field label="Phone" htmlFor="contact-phone" error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" autoComplete="tel" placeholder="98765 43210" inputMode="tel" />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-[var(--color-on-surface-variant)]">Leave whichever you would prefer to be contacted on.</p>

      {services.length > 0 && (
        <Field label="What is this about?" htmlFor="contact-service" error={errors.serviceId?.message}>
          <Select {...register('serviceId')}>
            <option value="">I am not sure yet</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field
        label="Your message"
        htmlFor="contact-message"
        required
        error={errors.message?.message}
        hint="A sentence or two about what is on your mind is plenty."
      >
        <Textarea {...register('message')} rows={5} placeholder="What would you like to discuss?" />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Do not fill this in</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} loadingText="Sending…" className="w-full sm:w-auto">
        <Send aria-hidden /> Send message
      </Button>

      <p className="text-xs leading-relaxed text-[var(--color-on-surface-variant)]">
        Your details are used only to reply to this enquiry. They are never shared or sold.
      </p>
    </form>
  );
}
