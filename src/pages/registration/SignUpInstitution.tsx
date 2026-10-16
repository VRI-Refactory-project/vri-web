import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import {
  collectErrors,
  sanitizePhoneInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  validateRequiredText,
} from '../../lib/validation';
import { describeError } from '../../services/api';
import { registerInstitution, type OrganisationType } from '../../services/registration';
import './AuthPages.css';

// The person who registers an institution becomes its admin (backend creates both).
const TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital or clinic' },
  { value: 'COURT', label: 'Court' },
  { value: 'GOVERNMENT', label: 'Government office' },
  { value: 'OTHER', label: 'Other' },
];

type FieldName =
  'organisationName' | 'organisationTypeOther' | 'name' | 'phone' | 'email' | 'password';
const FIELD_ORDER: FieldName[] = [
  'organisationName',
  'organisationTypeOther',
  'name',
  'phone',
  'email',
  'password',
];
const inputId = (name: FieldName) => `inst-${name}`;

export const SignUpInstitution = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    organisationName: '',
    organisationType: 'HOSPITAL' as OrganisationType,
    organisationTypeOther: '',
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // An error shows once the person has left the field, or tried to submit.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({
      ...f,
      [field]: field === 'phone' ? sanitizePhoneInput(e.target.value) : e.target.value,
    }));

  const isOther = form.organisationType === 'OTHER';

  // Worked out from the form on every render, so a submit never reads out-of-date results.
  const errors = collectErrors<FieldName>({
    organisationName: validateRequiredText(form.organisationName, 'Enter the institution name.'),
    organisationTypeOther: isOther
      ? validateRequiredText(
          form.organisationTypeOther,
          'Tell us what kind of institution this is.',
        )
      : undefined,
    name: validateName(form.name),
    phone: validatePhone(form.phone),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
  });
  const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
  const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

  // Shared props for a text input: error styling, accessibility links and the blur handler.
  const props = (name: FieldName) => ({
    id: inputId(name),
    className: shown(name) ? 'form-input form-input--error' : 'form-input',
    'aria-invalid': shown(name) ? true : undefined,
    'aria-describedby': shown(name) ? `${inputId(name)}-error` : undefined,
    onBlur: touch(name),
  });
  const message = (name: FieldName) =>
    shown(name) && (
      <p className="field-error" id={`${inputId(name)}-error`}>
        {shown(name)}
      </p>
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitted(true);
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      document.getElementById(inputId(firstInvalid))?.focus();
      return;
    }
    setSubmitting(true);
    try {
      login(await registerInstitution(form));
      navigate('/register/pending', { replace: true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Register your institution"
      subtitle="Set up secure interpreting access for your organisation."
      backTo="/get-started"
      steps={FLOWS.institution}
      current={2}
    >
      <form onSubmit={handleSubmit} noValidate className="inst-form">
        <div className="form-group">
          <label htmlFor="inst-organisationName">Institution name</label>
          <input
            {...props('organisationName')}
            type="text"
            placeholder="Mulago Medical Center"
            value={form.organisationName}
            onChange={set('organisationName')}
          />
          {message('organisationName')}
        </div>

        <div className="form-group">
          <label htmlFor="inst-type">Institution type</label>
          <select
            id="inst-type"
            className="form-input"
            value={form.organisationType}
            onChange={set('organisationType')}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {isOther && (
          <div className="form-group">
            <label htmlFor="inst-organisationTypeOther">Please specify the type</label>
            <input
              {...props('organisationTypeOther')}
              type="text"
              maxLength={100}
              placeholder="For example, a school for the deaf"
              value={form.organisationTypeOther}
              onChange={set('organisationTypeOther')}
            />
            {message('organisationTypeOther')}
          </div>
        )}

        <div className="inst-row">
          <div className="form-group">
            <label htmlFor="inst-name">Your full name</label>
            <input
              {...props('name')}
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
            />
            {message('name')}
          </div>

          <div className="form-group">
            <label htmlFor="inst-phone">Phone number</label>
            <input
              {...props('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+256 772 123 456"
              maxLength={20}
              value={form.phone}
              onChange={set('phone')}
            />
            {message('phone')}
          </div>
        </div>

        <div className="inst-row">
          <div className="form-group">
            <label htmlFor="inst-email">Work email</label>
            <input
              {...props('email')}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
            />
            {message('email')}
          </div>

          <div className="form-group">
            <label htmlFor="inst-password">Password</label>
            <div className="inst-password-wrap">
              <input
                {...props('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                className="inst-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {message('password')}
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '16px' }}
          disabled={submitting}
        >
          {submitting ? 'Please wait...' : 'Submit registration'} <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};
