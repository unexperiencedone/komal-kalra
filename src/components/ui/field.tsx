'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives.
 *
 * Accessibility is wired in here rather than left to each form, so it cannot be
 * forgotten: every input gets a real <label htmlFor>, errors are linked with
 * aria-describedby, invalid inputs carry aria-invalid, and the error text has
 * role="alert" so it is announced when it appears.
 */

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-clay)]" aria-hidden>*</span>}
        {!required && <span className="ml-1.5 text-xs font-normal text-[var(--color-stone)]">Optional</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-[var(--color-stone)]">{hint}</p>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
          })
        : children}

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-[var(--color-clay)]">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

const controlBase =
  'w-full rounded-[var(--radius-control)] border border-[var(--color-linen)] bg-white px-3.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-placeholder)] transition-colors hover:border-[var(--color-edge-hover)] focus:border-[var(--color-saffron)] disabled:cursor-not-allowed disabled:bg-[var(--color-sand)] disabled:opacity-70 aria-[invalid=true]:border-[var(--color-clay)]';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlBase, 'h-11', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlBase, 'min-h-28 resize-y py-2.5 leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, 'h-11 pr-9', className)} {...props} />
  ),
);
Select.displayName = 'Select';

export function Checkbox({
  label, className, id, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-bark)]', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[3px] border-[var(--color-stone)] accent-[var(--color-saffron)]"
        {...props}
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}
