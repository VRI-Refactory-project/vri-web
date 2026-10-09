import {
  collectErrors,
  normalizePhone,
  sanitizePhoneInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from './validation';

describe('phone numbers', () => {
  it('accepts a number with a country code, from any country', () => {
    expect(validatePhone('+256772123456')).toBeUndefined();
    expect(validatePhone('+254 712 345 678')).toBeUndefined();
    expect(validatePhone('+1-415-555-0132')).toBeUndefined();
  });

  it('rejects a number without a country code', () => {
    expect(validatePhone('0772123456')).toMatch(/country code/);
    expect(validatePhone('772123456')).toMatch(/country code/);
  });

  it('rejects letters and malformed numbers', () => {
    expect(validatePhone('+256abc123456')).toMatch(/digits only/);
    expect(validatePhone('+0772123456')).toMatch(/digits only/);
    expect(validatePhone('+256')).toMatch(/digits only/);
    expect(validatePhone('+2567721234567890123')).toMatch(/digits only/);
  });

  it('asks for a number when it is empty', () => {
    expect(validatePhone('  ')).toBe('Enter your phone number.');
  });

  it('normalizes spaces and dashes away', () => {
    expect(normalizePhone('+256 772-123 456')).toBe('+256772123456');
  });

  it('never lets letters into the field while typing or pasting', () => {
    expect(sanitizePhoneInput('abc')).toBe('');
    expect(sanitizePhoneInput('+256 7a7b2')).toBe('+256 772');
    expect(sanitizePhoneInput('07-72')).toBe('07-72');
  });

  it('allows a single + and only at the start', () => {
    expect(sanitizePhoneInput('+2+56')).toBe('+256');
    expect(sanitizePhoneInput('256+')).toBe('256');
    expect(sanitizePhoneInput('   +256')).toBe('+256');
  });
});

describe('email', () => {
  it('accepts an ordinary address', () => {
    expect(validateEmail('amina@example.com')).toBeUndefined();
    expect(validateEmail('a.b+c@mulago.go.ug')).toBeUndefined();
  });

  it('rejects an address that is only numbers before the @', () => {
    expect(validateEmail('12345@example.com')).toMatch(/only numbers/);
  });

  it('rejects text that is not an address, including only numbers', () => {
    expect(validateEmail('12345')).toMatch(/valid email/);
    expect(validateEmail('amina@')).toMatch(/valid email/);
    expect(validateEmail('amina@example')).toMatch(/valid email/);
    expect(validateEmail('amina example@x.com')).toMatch(/valid email/);
  });

  it('can be optional', () => {
    expect(validateEmail('', { required: false })).toBeUndefined();
    expect(validateEmail('12345', { required: false })).toMatch(/valid email/);
  });

  it('is required by default', () => {
    expect(validateEmail('')).toBe('Enter your email address.');
  });
});

describe('names', () => {
  it('accepts letters, hyphens, apostrophes and accents', () => {
    expect(validateName('Nakyeyune Hope')).toBeUndefined();
    expect(validateName("Anne-Marie O'Neil")).toBeUndefined();
    expect(validateName('José Müller')).toBeUndefined();
  });

  it('rejects digits and symbols', () => {
    expect(validateName('Amina 2')).toMatch(/letters/);
    expect(validateName('Amina@home')).toMatch(/letters/);
  });

  it('rejects empty and one-letter names', () => {
    expect(validateName(' ')).toBe('Enter your full name.');
    expect(validateName('A')).toMatch(/too short/);
  });

  it('can name what is being asked for', () => {
    expect(validateName('', 'the contact name')).toBe('Enter the contact name.');
  });
});

describe('passwords', () => {
  it('accepts eight or more characters that are not only digits', () => {
    expect(validatePassword('secret-pass-1')).toBeUndefined();
  });

  it('rejects short and numbers-only passwords', () => {
    expect(validatePassword('')).toBe('Enter a password.');
    expect(validatePassword('abc12')).toMatch(/at least 8/);
    expect(validatePassword('12345678')).toMatch(/only numbers/);
  });
});

describe('required text and error collection', () => {
  it('checks required text', () => {
    expect(validateRequiredText('', 'Enter the name.')).toBe('Enter the name.');
    expect(validateRequiredText('M', 'Enter the name.')).toMatch(/too short/);
    expect(validateRequiredText('Mulago', 'Enter the name.')).toBeUndefined();
  });

  it('keeps only the checks that failed', () => {
    expect(collectErrors({ a: 'Bad', b: undefined, c: 'Worse' })).toEqual({ a: 'Bad', c: 'Worse' });
  });
});
