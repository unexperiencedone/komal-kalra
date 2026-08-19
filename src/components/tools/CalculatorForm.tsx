'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';

export function CalculatorForm({ toolSlug }: { toolSlug: string }) {
  const [showModal, setShowModal] = useState(false);

  if (toolSlug === 'numerology') {
    return <NumerologyForm />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true); // Trigger paywall modal before showing results
  };

  const isMatching = toolSlug === 'kundli-matching';

  const renderFields = (prefix = '') => (
    <div className="space-y-6">
      <h3 className="font-medium text-[var(--color-cocoa)] border-b border-[var(--color-hairline)] pb-2 mb-4">
        {prefix ? `${prefix} Details` : 'Birth Details'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Full Name" htmlFor={`${prefix}Name`} required>
          <Input id={`${prefix}Name`} name={`${prefix}Name`} required />
        </Field>
        <Field label="Gender" htmlFor={`${prefix}Gender`} required>
          <Select id={`${prefix}Gender`} name={`${prefix}Gender`} required>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Date of Birth" htmlFor={`${prefix}Date`} required>
          <Input id={`${prefix}Date`} name={`${prefix}Date`} type="date" required />
        </Field>
        <Field label="Time of Birth" htmlFor={`${prefix}Time`} required>
          <Input id={`${prefix}Time`} name={`${prefix}Time`} type="time" required />
        </Field>
        <Field label="Birth City" htmlFor={`${prefix}City`} required>
          <Input id={`${prefix}City`} name={`${prefix}City`} placeholder="e.g. New Delhi" required />
        </Field>
      </div>
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-10">
        {isMatching ? (
          <>
            {renderFields('Boy')}
            {renderFields('Girl')}
          </>
        ) : (
          renderFields()
        )}
        
        <Button type="submit" size="lg" variant="primary" className="w-full md:w-auto shadow-[4px_4px_0_0_var(--color-saffron-deep)]">
          Calculate Result
        </Button>
      </form>

      {showModal && (
        <LeadCaptureModal toolSlug={toolSlug} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function LeadCaptureModal({ toolSlug, onClose }: { toolSlug: string; onClose: () => void }) {
  const [step, setStep] = useState<'capture' | 'otp' | 'result'>('capture');

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('otp');
  };

  const handleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('result');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[var(--color-card-cream)] p-8 border border-[var(--color-hairline)] before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none before:z-10 shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 z-20 text-[var(--color-body-warm)] hover:text-[var(--color-cocoa)]">&times;</button>
        
        <div className="relative z-20">
          {step === 'capture' && (
            <form onSubmit={handleCapture}>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">Where should we send your report?</h3>
              <p className="mt-2 text-sm text-[var(--color-body-warm)]">Enter your details to view your personalized analysis immediately.</p>
              
              <div className="mt-6 space-y-4">
                <Field label="Phone Number (optional)" htmlFor="phone">
                  <Input id="phone" name="phone" type="tel" />
                </Field>
                <Field label="Email Address" htmlFor="email" required>
                  <Input id="email" name="email" type="email" required />
                </Field>
              </div>

              <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-[var(--color-body-warm)]">
                <input type="checkbox" required className="mt-1 accent-[var(--color-saffron-deep)]" />
                <span>I agree to the <a href="/legal/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">privacy policy</a> and consent to receive this calculation.</span>
              </label>
              
              <Button type="submit" variant="primary" className="w-full mt-8">Send OTP</Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtp}>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">Verify your number</h3>
              <p className="mt-2 text-sm text-[var(--color-body-warm)]">We sent a 4-digit code to your phone.</p>
              
              <div className="mt-6">
                <Field label="OTP Code" htmlFor="otp" required>
                  <Input id="otp" name="otp" type="text" maxLength={4} required className="text-center tracking-[1em] font-mono text-xl" />
                </Field>
              </div>
              
              <Button type="submit" variant="primary" className="w-full mt-8">Unlock Report</Button>
            </form>
          )}

          {step === 'result' && (
            <div className="text-center py-6">
              <div className="mx-auto size-16 bg-[var(--color-cocoa)] rounded-full flex items-center justify-center mb-6 text-[var(--color-saffron-lift)] text-2xl">✓</div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-cocoa)]">Analysis Complete</h3>
              <p className="mt-4 text-base text-[var(--color-body-warm)] mb-8">
                Your {toolSlug.replace('-', ' ')} request has been received. The completed calculation will appear here once the astrology provider is connected.
              </p>
              <Button onClick={onClose} variant="secondary" className="w-full">Close Report</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumerologyForm() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reduce = (value: number) => {
    let current = value;
    while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
      current = String(current).split('').reduce((sum, digit) => sum + Number(digit), 0);
    }
    return current;
  };
  const psychic = date ? reduce(Number(date.slice(-2))) : null;
  const destiny = date ? reduce(Number(date.replaceAll('-', ''))) : null;
  const nameNumber = name ? reduce(name.toUpperCase().split('').reduce((sum, char) => sum + (char >= 'A' && char <= 'Z' ? char.charCodeAt(0) - 64 : 0), 0)) : null;

  return (
    <div className="space-y-8">
      <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="space-y-6">
        <h2 className="border-b border-[var(--color-hairline)] pb-3 font-[family-name:var(--font-display)] text-3xl text-[var(--color-cocoa)]">Enter Details</h2>
        <Field label="Full Name" htmlFor="numerology-name" required>
          <Input id="numerology-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Date of Birth" htmlFor="numerology-date" required>
          <Input id="numerology-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Button type="submit" size="lg" variant="primary" className="w-full shadow-[4px_4px_0_0_var(--color-cocoa)]">Calculate Numbers</Button>
      </form>
      {submitted && (
        <div className="grid gap-4 border-t border-[var(--color-hairline)] pt-8 md:grid-cols-3">
          {[{ label: 'Psychic Number', value: psychic }, { label: 'Destiny Number', value: destiny }, { label: 'Name Number', value: nameNumber }].map((item) => (
            <div key={item.label} className="border border-[var(--color-hairline)] bg-[var(--color-cream)] p-5 text-center">
              <div className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-cocoa)]">{item.value ?? '—'}</div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-saffron-deep)]">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
