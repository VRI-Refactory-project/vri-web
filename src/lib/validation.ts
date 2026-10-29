// Shared form validation for the sign-up, sign-in and recovery pages.
// Every validator is a plain function: it returns a message for the person filling in the form,
// or undefined when the value is fine. The API checks the same rules again, so these exist to
// help people fix a mistake before they send, not to protect the server.

import { isValidPhoneNumber } from 'react-phone-number-input';

export const PHONE_EXAMPLE = '+256772123456';

/** Remove the spaces and dashes people type for readability. This is what the API receives. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/**
 * Applied while typing and pasting, so letters never reach a phone field. Keeps digits, spaces,
 * dashes and a single + at the start.
 */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+\s-]/g, '').replace(/^\s+/, '');
  const rest = cleaned.replace(/\+/g, '');
  return (cleaned.startsWith('+') ? '+' : '') + rest;
}


/** Validates international phone numbers used by sign-in and recovery. */
export function validatePhone(value: string): string | undefined {
  const phone = normalizePhone(value);

  if (!phone) return 'Enter your phone number.';

  if (!phone.startsWith('+')) {
    return `Start with your country code, for example ${PHONE_EXAMPLE}.`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return `Use a country code and digits only, for example ${PHONE_EXAMPLE}.`;
  }

  if (!isValidPhoneNumber(phone)) {
    return 'Enter a valid phone number for the country code you chose.';
  }

  return undefined;
}

/** Validates the complete international number returned by PhoneField. */
export function validatePhoneNumber(value: string): string | undefined {
  if (!value) return 'Enter your phone number.';

  const phone = normalizePhone(value);

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return 'That phone number looks too short or too long for the country you chose.';
  }

  if (!isValidPhoneNumber(phone)) {
    return 'Enter a valid phone number for the country you chose.';
  }

  return undefined;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(
  value: string,
  options: { required?: boolean } = {},
): string | undefined {
  const { required = true } = options;
  const email = value.trim();
  if (!email) return required ? 'Enter your email address.' : undefined;
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address, like name@example.com.';
  if (/^\d+$/.test(email.split('@')[0])) {
    return 'The part before the @ cannot be only numbers.';
  }
  return undefined;
}

const NAME_PATTERN = /^\p{L}[\p{L}\s'’.-]*$/u;

/** Letters from any alphabet, plus spaces, hyphens, apostrophes and full stops (O'Neil, Anne-Marie). */
export function validateName(value: string, what = 'your full name'): string | undefined {
  const name = value.trim();
  if (!name) return `Enter ${what}.`;
  if (name.length < 2) return 'That is too short.';
  if (!NAME_PATTERN.test(name)) return 'Use letters, spaces, hyphens and apostrophes only.';
  return undefined;
}

/**
 * The password rules, in one place. The sign-up page shows these as the green ticks, and
 * validatePassword below uses the same list, so the two can never disagree.
 * `error` is the message shown if the rule fails when the form is submitted.
 */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    error: 'Use at least 8 characters.',
    test: (p: string) => p.length >= 8,
  },
  {
    id: 'upper',
    label: 'One uppercase letter',
    error: 'Add one uppercase letter.',
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: 'numspecial',
    label: 'One number & special character',
    error: 'Add one number and one special character, like ! or -.',
    test: (p: string) => /\d/.test(p) && /[^A-Za-z0-9]/.test(p),
  },
];

/**
 * Strength for the meter: score is the number of bars to fill (0 to 4).
 * 0 or 1 rules met = Weak, 2 = Fair, all 3 = Good, all 3 and 12+ characters = Strong.
 */
export function getPasswordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  let score = Math.max(1, passed);
  if (passed === PASSWORD_RULES.length && password.length >= 12) score = 4;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

/** For choosing a new password only. Never use this on sign-in: older accounts must still get in. */
export function validatePassword(value: string): string | undefined {
  if (!value) return 'Enter a password.';
  const failed = PASSWORD_RULES.find((r) => !r.test(value));
  return failed ? failed.error : undefined;
}

/** A required text field, such as an institution name. */
export function validateRequiredText(
  value: string,
  message: string,
  minLength = 2,
): string | undefined {
  const text = value.trim();
  if (!text) return message;
  if (text.length < minLength) return 'That is too short.';
  return undefined;
}

/** Turns a map of check results into a map of only the messages, so `Object.keys` is the error count. */
export function collectErrors<K extends string>(
  checks: Record<K, string | undefined>,
): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const key of Object.keys(checks) as K[]) {
    const message = checks[key];
    if (message) errors[key] = message;
  }
  return errors;
}

/**
 * One box that takes either an email address or a phone number (sign-in, password recovery).
 * An @ means email; a leading + or digit means phone, which must start with a country code.
 */
export function validateIdentifier(value: string): string | undefined {
  const text = value.trim();
  if (!text) return 'Enter your email address or phone number.';
  if (text.includes('@')) return validateEmail(text);
  if (/^[+\d]/.test(text)) return validatePhone(text);
  return `Enter a valid email address, or a phone number that starts with your country code, for example ${PHONE_EXAMPLE}.`;
}

/** What the API receives for an identifier: emails as typed, phone numbers without spaces or dashes. */
export function identifierForApi(value: string): string {
  const text = value.trim();
  return text.includes('@') ? text : normalizePhone(text);
}

/** Sign-in only checks that a password was typed. Older accounts may not meet today's password rules. */
export function validatePasswordPresent(value: string): string | undefined {
  return value ? undefined : 'Enter your password.';
}

/** Digits only, at most six, so letters never reach the code field. */
export function sanitizeCodeInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

/** The 6-digit code that password recovery emails. */
export function validateCode(value: string): string | undefined {
  const code = value.trim();
  if (!code) return 'Enter the 6-digit code from your email.';
  if (!/^\d{6}$/.test(code)) return 'The code has 6 digits.';
  return undefined;
}
