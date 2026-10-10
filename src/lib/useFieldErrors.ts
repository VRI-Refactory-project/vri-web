import { useState } from 'react';

// Shows each field's message once the person has left the field or tried to submit, and moves
// the cursor to the first problem on submit. The messages themselves are worked out by the page
// on every render (see collectErrors in ./validation), so they are never out of date.

export function useFieldErrors<K extends string>(
  errors: Partial<Record<K, string>>,
  order: readonly K[],
  idFor: (name: K) => string,
) {
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const shown = (name: K): string | undefined =>
    touched[name] || submitted ? errors[name] : undefined;

  const touch = (name: K) => () => setTouched((t) => ({ ...t, [name]: true }));

  /** Call when the form is submitted. Returns true when every field is fine. */
  const check = (): boolean => {
    setSubmitted(true);
    const firstInvalid = order.find((name) => errors[name]);
    if (firstInvalid) {
      document.getElementById(idFor(firstInvalid))?.focus();
      return false;
    }
    return true;
  };

  /** The props every text input needs: id, error styling, accessibility links and blur handling. */
  const fieldProps = (name: K) => {
    const message = shown(name);
    return {
      id: idFor(name),
      className: message ? 'form-input form-input--error' : 'form-input',
      'aria-invalid': message ? (true as const) : undefined,
      'aria-describedby': message ? `${idFor(name)}-error` : undefined,
      onBlur: touch(name),
    };
  };

  return { shown, touch, check, fieldProps };
}
