'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Form fields — "Minimalist Frames".
 *
 * Per the spec: inputs carry only a bottom border at rest and become a full
 * sharp box on focus, with the border transitioning to Muted Gold. Zero radius
 * throughout.
 *
 * Accessibility is wired here rather than left to each form so it cannot be
 * forgotten: real <label htmlFor>, aria-describedby linking hint and error,
 * aria-invalid, and role="alert" on the error so it is announced when it
 * appears.
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
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={htmlFor}
        className={cn("label-caps block", error ? "text-[var(--color-error)]" : "text-[var(--color-body-warm)]")}
      >
        {label}
        {required && <span className="ml-1 text-[var(--color-error)]" aria-hidden>*</span>}
        {!required && <span className="ml-2 normal-case tracking-normal opacity-60">Optional</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-[var(--color-body-warm)] opacity-80">
          {hint}
        </p>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
          })
        : children}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  'field-underline w-full px-0 py-2.5 text-base text-[var(--color-body-warm)] placeholder:text-[var(--color-outline)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-b-[var(--color-error)] bg-transparent';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(control, 'h-11', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(control, 'min-h-28 resize-y leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(control, 'h-11 pr-8', className)} {...props} />
  ),
);
Select.displayName = 'Select';

export function Checkbox({
  label, className, id, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-start gap-3 text-sm text-[var(--color-body-warm)]', className)}
    >
      {/* Square, like everything else. */}
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-none border border-[var(--color-outline)] accent-[var(--color-terracotta)]"
        {...props}
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}
