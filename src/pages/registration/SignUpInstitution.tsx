import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { PasswordStrength } from '../../components/PasswordStrength';
import { PhoneField } from '../../components/PhoneField';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import { LegalModal } from '../../components/LegalModal';
import { TermsContent, PrivacyContent } from '../../components/LegalContent';
import {
  collectErrors,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
  validateRequiredText,
} from '../../lib/validation';
import { describeError } from '../../services/api';
import { registerInstitution, type OrganisationType } from '../../services/registration';
import './AuthPages.css';

const TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital or clinic' },
  { value: 'COURT', label: 'Court' },
  { value: 'GOVERNMENT', label: 'Government Office' },
  { value: 'SCHOOL', label: 'School or Institution' },
  { value: 'POLICE', label: 'Police Station' },
  { value: 'CHURCH', label: 'Church' },
  { value: 'OTHER', label: 'Other' },
];

type FieldName =
  | 'organisationName'
  | 'organisationTypeOther'
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirm';

const FIELD_ORDER: FieldName[] = [
  'organisationName',
  'organisationTypeOther',
  'name',
  'email',
  'phone',
  'password',
  'confirm',
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

  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const isOther = form.organisationType === 'OTHER';

  const errors = collectErrors<FieldName>({
    organisationName: validateRequiredText(form.organisationName, 'Enter the institution name.'),
    organisationTypeOther: isOther
      ? validateRequiredText(
          form.organisationTypeOther,
          'Tell us what kind of institution this is.',
        )
      : undefined,
    name: validateName(form.name),
    phone: validatePhoneNumber(form.phone),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirm: !confirmPassword
      ? 'Confirm your password.'
      : confirmPassword !== form.password
        ? 'Passwords do not match.'
        : undefined,
  });
  const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
  const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

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
      // Assuming registerInstitution logs the user in automatically (as you had before)
      login(await registerInstitution(form));

      // Route to verify email, passing the next destination
      navigate('/verify-email', {
        replace: true,
        state: { next: '/register/institution/upload-license' },
      });
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
          <label htmlFor={isOther ? 'inst-organisationTypeOther' : 'inst-type'}>
            {isOther ? 'Please specify the type' : 'Institution type'}
          </label>

          {isOther ? (
            <div>
              <input
                {...props('organisationTypeOther')}
                id="inst-organisationTypeOther"
                type="text"
                autoFocus
                maxLength={100}
                placeholder="Type your institution type..."
                value={form.organisationTypeOther}
                onChange={set('organisationTypeOther')}
              />
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    organisationType: 'HOSPITAL',
                    organisationTypeOther: '',
                  }));
                  setTouched((t) => ({ ...t, organisationTypeOther: false }));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F46E5',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginTop: '8px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Back to list
              </button>
            </div>
          ) : (
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
          )}

          {isOther && message('organisationTypeOther')}
        </div>

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
        </div>

        <div className="form-group">
          <label htmlFor="inst-phone">Phone number</label>
          <PhoneField
            id={inputId('phone')}
            value={form.phone}
            onChange={(phone) => setForm((f) => ({ ...f, phone }))}
            onBlur={touch('phone')}
            invalid={Boolean(shown('phone'))}
            errorId={shown('phone') ? `${inputId('phone')}-error` : undefined}
          />
          {message('phone')}
        </div>

        <div className="inst-row">
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

          <div className="form-group">
            <label htmlFor="inst-confirm">Confirm password</label>
            <input
              {...props('confirm')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {message('confirm')}
          </div>
        </div>

        <PasswordStrength password={form.password} />

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="ca-terms">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  padding: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  padding: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Privacy Policy
              </button>
            </span>
          </label>
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
          disabled={submitting || !agreed}
        >
          {submitting ? 'Please wait...' : 'Submit registration'} <ChevronRight size={18} />
        </button>
      </form>

      <p className="ca-footer">
        Have an account? <Link to="/sign-in">Sign in</Link>
      </p>

      <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
        <TermsContent />
      </LegalModal>

      <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <PrivacyContent role="institution" />
      </LegalModal>
    </AuthLayout>
  );
};
