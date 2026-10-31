import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Award,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { PhoneField } from '../../components/PhoneField';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import { LegalModal } from '../../components/LegalModal';
import { TermsContent, PrivacyContent } from '../../components/LegalContent';
import {
  PASSWORD_RULES,
  collectErrors,
  getPasswordStrength,
  normalizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from '../../lib/validation';
import { describeError } from '../../services/api';
import { checkEmailAvailability } from '../../services/emailAvailability';
import { checkPhoneAvailability } from '../../services/phoneAvailability';
import {
  registerDeaf,
  registerInterpreter,
  type Specialisation,
} from '../../services/registration';
import './CreateAccountPage.css';

const SPECIALISATIONS: { value: Specialisation; label: string }[] = [
  { value: 'GENERAL', label: 'General / everyday' },
  { value: 'MEDICAL', label: 'Medical / health' },
  { value: 'LEGAL', label: 'Legal / court' },
  { value: 'EDUCATION', label: 'Education / school' },
  { value: 'RELIGIOUS', label: 'Religious / church or mosque' },
  { value: 'SECURITY', label: 'Police / security' },
  { value: 'GOVERNMENT', label: 'Government / public services' },
  { value: 'EMPLOYMENT', label: 'Employment / workplace' },
  { value: 'FINANCIAL', label: 'Banking / financial' },
  { value: 'MENTAL_HEALTH', label: 'Mental health / counselling' },
  { value: 'SOCIAL_SERVICES', label: 'Social services / community' },
  { value: 'MEDIA', label: 'Media / broadcast' },
  { value: 'TECHNICAL', label: 'Technical / IT' },
  { value: 'EVENTS', label: 'Conferences / events' },
  { value: 'OTHER', label: 'Other (please specify)' },
];

type FieldName = 'firstname' | 'lastname' | 'email' | 'phone' | 'password' | 'confirm' | 'terms';

type EmailAvailability = 'idle' | 'checking' | 'available' | 'taken' | 'failed';

// Same order as the fields appear on screen, so a failed submit focuses the first one you see.
const FIELD_ORDER: FieldName[] = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'password',
  'confirm',
  'terms',
];

function field(
  id: string,
  label: string,
  icon: ReactNode,
  input: InputHTMLAttributes<HTMLInputElement>,
  error?: string,
) {
  const errorId = `${id}-error`;

  return (
    <div className="ca-field">
      <label className="ca-label" htmlFor={id}>
        {label}
      </label>

      <div className="ca-input-wrap">
        <span className="ca-input-icon">{icon}</span>

        <input
          id={id}
          className={error ? 'ca-input ca-input--error' : 'ca-input'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...input}
        />
      </div>

      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  role?: 'deaf' | 'interpreter';
}

export function CreateAccountPage({ role = 'deaf' }: Props) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isInterpreter = role === 'interpreter';

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [agreed, setAgreed] = useState(false);

  // Legal modal state.
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Interpreter specialisation multi-select state.
  const [specialisations, setSpecialisations] = useState<Specialisation[]>([]);
  const [customSpecialisation, setCustomSpecialisation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Email availability result, stored together with the address it was fetched for,
  // plus a request identity that changes whenever the email field changes.
  const [emailCheck, setEmailCheck] = useState<{ email: string; status: EmailAvailability }>({
    email: '',
    status: 'idle',
  });
  const emailRequestId = useRef(0);
  const [phoneCheck, setPhoneCheck] = useState<{ phone: string; status: EmailAvailability }>({
    phone: '',
    status: 'idle',
  });

  const [videoDismissed, setVideoDismissed] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close the specialisation dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  const toggleSpecialisation = (value: Specialisation) => {
    setSpecialisations((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  // Every edit changes the request identity, so the submit code below can tell
  // if the email changed while it was checking.
  useEffect(() => {
    emailRequestId.current += 1;
  }, [form.email]);

  const checkEmailNow = async () => {
    const email = form.email.trim();

    if (!email || validateEmail(email, { required: true })) return;

    if (
      emailCheck.email === email &&
      emailCheck.status !== 'idle' &&
      emailCheck.status !== 'failed'
    ) {
      return;
    }

    setEmailCheck({ email, status: 'checking' });

    const record = (status: EmailAvailability) =>
      setEmailCheck((prev) =>
        prev.email === email && prev.status === 'checking' ? { email, status } : prev,
      );

    try {
      const available = await checkEmailAvailability(email);
      record(available ? 'available' : 'taken');
    } catch {
      record('failed');
    }
  };

  const checkPhoneNow = async () => {
    const phone = normalizePhone(form.phone);

    if (!form.phone || validatePhoneNumber(form.phone)) return;

    if (
      phoneCheck.phone === phone &&
      phoneCheck.status !== 'idle' &&
      phoneCheck.status !== 'failed'
    ) {
      return;
    }

    setPhoneCheck({ phone, status: 'checking' });

    const record = (status: EmailAvailability) =>
      setPhoneCheck((prev) =>
        prev.phone === phone && prev.status === 'checking' ? { phone, status } : prev,
      );

    try {
      const available = await checkPhoneAvailability(phone);
      record(available ? 'available' : 'taken');
    } catch {
      record('failed');
    }
  };

  const emailAvailability: EmailAvailability =
    emailCheck.email === form.email.trim() ? emailCheck.status : 'idle';

  const phoneAvailability: EmailAvailability =
    phoneCheck.phone === normalizePhone(form.phone) ? phoneCheck.status : 'idle';

  // Recalculated on every keystroke: drives the strength bars and green ticks.
  const strength = getPasswordStrength(form.password);

  const errors = collectErrors<FieldName>({
    firstname: validateName(form.firstname, 'your first name'),
    lastname: validateName(form.lastname, 'your last name'),
    phone: validatePhoneNumber(form.phone),
    email: validateEmail(form.email, { required: true }),
    password: validatePassword(form.password),
    confirm: !form.confirmPassword
      ? 'Confirm your password.'
      : form.confirmPassword !== form.password
        ? 'Passwords do not match.'
        : undefined,
    terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
  });

  const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);

  const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

  const emailError =
    shown('email') ||
    (emailAvailability === 'taken'
      ? 'This email already exists. Sign in instead, or use a different email.'
      : undefined);

  const phoneError =
    shown('phone') ||
    (phoneAvailability === 'taken'
      ? 'This phone number already exists. Sign in instead, or use a different number.'
      : undefined);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitted(true);

    if (isInterpreter && specialisations.length === 0) {
      setError('Please select at least one specialisation.');
      return;
    }

    if (isInterpreter && specialisations.includes('OTHER') && !customSpecialisation.trim()) {
      setError('Please specify your other specialisation.');
      return;
    }

    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);

    if (firstInvalid) {
      document.getElementById(`ca-${firstInvalid}`)?.focus();
      return;
    }

    // Do not submit an address that we already know is registered.
    if (emailAvailability === 'taken') {
      setTouched((t) => ({ ...t, email: true }));
      document.getElementById('ca-email')?.focus();
      return;
    }
    if (phoneAvailability === 'taken') {
      setTouched((t) => ({ ...t, phone: true }));
      document.getElementById('ca-phone')?.focus();
      return;
    }

    setSubmitting(true);

    // The address this attempt is for, and the request identity at the moment of submitting.
    // The identity changes every time the email field changes, so it tells us afterwards
    // whether the person edited the email while the check below was still running.
    const submittedEmail = form.email.trim();
    const submitRequestId = emailRequestId.current;

    try {
      // Recheck at submission time so we don't rely only on a potentially old result.
      // If the check fails due to a network/server issue, registration still gets the
      // final opportunity to validate the email.
      let available: boolean | undefined;

      try {
        available = await checkEmailAvailability(submittedEmail);
      } catch {
        available = undefined;
      }

      // The email changed while we were waiting. Stop here rather than register the old
      // address; the person can submit again with what is now in the field.
      if (emailRequestId.current !== submitRequestId) {
        return;
      }

      if (available === undefined) {
        setEmailCheck({ email: submittedEmail, status: 'failed' });
      } else {
        setEmailCheck({ email: submittedEmail, status: available ? 'available' : 'taken' });

        if (!available) {
          setTouched((t) => ({ ...t, email: true }));
          document.getElementById('ca-email')?.focus();
          return;
        }
      }

      // The backend still does the final duplicate-email check when it creates the account.
      // confirmPassword is deliberately left out: the API never needs it.
      const registrationData = {
        name: `${form.firstname.trim()} ${form.lastname.trim()}`,
        phone: form.phone,
        email: submittedEmail,
        password: form.password,
      };

      const session = isInterpreter
        ? await registerInterpreter({
            ...registrationData,
            specialisations,
            specialisationOther: customSpecialisation,
          })
        : await registerDeaf(registrationData);

      login(session);

      navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
        replace: true,
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Get the text to show inside the dropdown box.
  const getSelectedLabel = () => {
    if (specialisations.length === 0) return 'Select specialisation(s)...';

    return SPECIALISATIONS.filter((o) => specialisations.includes(o.value))
      .map((o) => o.label)
      .join(', ');
  };

  return (
    <AuthShell
      backTo="/get-started"
      steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
      current={2}
    >
      {!videoDismissed && (
        <div className="ca-video-widget">
          <button
            type="button"
            className="ca-video-close"
            onClick={() => setVideoDismissed(true)}
            aria-label="Close video"
          >
            ×
          </button>

          <video
            ref={videoRef}
            className="ca-video"
            src="/videos/placeholder.mp4"
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;

              if (v.duration) setVideoProgress((v.currentTime / v.duration) * 100);

              setCurrentTime(v.currentTime);
            }}
          />

          <div className="ca-video-caption">Watch the video for help in sign language</div>

          <div className="ca-video-controls">
            <span className="ca-video-time">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>

            <div className="ca-video-progress">
              <div className="ca-video-progress-fill" style={{ width: `${videoProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <h1 className="ca-title">Create your account</h1>
      <p className="ca-subtitle">Watch the video for help in sign language.</p>

      <form onSubmit={onSubmit} noValidate className="ca-form">
        <div className="ca-row">
          {field(
            'ca-firstname',
            'First name',
            <User size={16} />,
            {
              type: 'text',
              autoComplete: 'given-name',
              placeholder: 'Your first name',
              value: form.firstname,
              onChange: set('firstname'),
              onBlur: touch('firstname'),
            },
            shown('firstname'),
          )}

          {field(
            'ca-lastname',
            'Last name',
            <User size={16} />,
            {
              type: 'text',
              autoComplete: 'family-name',
              placeholder: 'Your last name',
              value: form.lastname,
              onChange: set('lastname'),
              onBlur: touch('lastname'),
            },

            shown('lastname'),
          )}
        </div>

        {/* Email field: keep validation and duplicate-email warnings. */}
        {field(
          'ca-email',
          'Email address',
          <Mail size={16} />,
          {
            type: 'email',
            autoComplete: 'email',
            placeholder: 'name@example.com',
            value: form.email,
            onChange: set('email'),
            onBlur: () => {
              touch('email')();
              void checkEmailNow();
            },
          },
          emailError,
        )}

        {/* Phone on its own row. Existing phone validation is preserved. */}
        <div className="ca-field">
          <label className="ca-label" htmlFor="ca-phone">
            Phone number
          </label>

          <PhoneField
            id="ca-phone"
            value={form.phone}
            onChange={(phone) => setForm((f) => ({ ...f, phone }))}
            onBlur={() => {
              touch('phone')();
              void checkPhoneNow();
            }}
            invalid={Boolean(phoneError)}
            errorId={phoneError ? 'ca-phone-error' : undefined}
          />

          {phoneError && (
            <p className="field-error" id="ca-phone-error">
              {phoneError}
            </p>
          )}
        </div>

        {/* Custom multi-select dropdown. */}
        {isInterpreter && (
          <div className="ca-field" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="ca-label">Specialisation(s)</label>

            <div
              className="ca-input-wrap"
              onClick={() => {
                if (!specialisations.includes('OTHER')) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span className="ca-input-icon">
                <Award size={16} />
              </span>

              {specialisations.includes('OTHER') ? (
                <input
                  type="text"
                  className="ca-input"
                  placeholder="Type your specialisation..."
                  value={customSpecialisation}
                  onChange={(e) => setCustomSpecialisation(e.target.value)}
                  autoFocus
                  style={{ paddingRight: '40px' }}
                />
              ) : (
                <div
                  className="ca-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    style={{
                      color: specialisations.length === 0 ? '#9ca3af' : '#111827',
                    }}
                  >
                    {getSelectedLabel()}
                  </span>
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#6b7280',
                }}
              >
                <ChevronDown size={16} />
              </div>
            </div>

            {isDropdownOpen && !specialisations.includes('OTHER') && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginTop: '4px',
                  padding: '8px',
                  zIndex: 50,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {SPECIALISATIONS.map((o) => (
                  <div
                    key={o.value}
                    onClick={() => {
                      toggleSpecialisation(o.value);
                      if (o.value === 'OTHER') setIsDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      borderRadius: '4px',
                      backgroundColor: specialisations.includes(o.value)
                        ? '#f3f4f6'
                        : 'transparent',
                      fontWeight: specialisations.includes(o.value) ? '600' : 'normal',
                    }}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}

            {specialisations.includes('OTHER') && (
              <button
                type="button"
                onClick={() => {
                  setSpecialisations((prev) => prev.filter((s) => s !== 'OTHER'));
                  setCustomSpecialisation('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#382c77',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                Back to list
              </button>
            )}
          </div>
        )}

        <div className="ca-row">
          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-password">
              Password
            </label>

            <div className="ca-input-wrap">
              <span className="ca-input-icon">
                <Lock size={16} />
              </span>

              <input
                id="ca-password"
                className={shown('password') ? 'ca-input ca-input--error' : 'ca-input'}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={shown('password') ? true : undefined}
                aria-describedby={shown('password') ? 'ca-password-error' : undefined}
                value={form.password}
                onChange={set('password')}
                onBlur={touch('password')}
              />

              <button
                type="button"
                className="ca-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {shown('password') && (
              <p className="field-error" id="ca-password-error">
                {shown('password')}
              </p>
            )}
          </div>

          {field(
            'ca-confirm',
            'Confirm password',
            <Lock size={16} />,
            {
              type: showPassword ? 'text' : 'password',
              autoComplete: 'new-password',
              placeholder: 'Re-enter password',
              value: form.confirmPassword,
              onChange: set('confirmPassword'),
              onBlur: touch('confirm'),
            },
            shown('confirm'),
          )}
        </div>

        {/* Password strength and requirement ticks. */}
        {form.password && (
          <>
            <div className="pw-strength">
              <div className="pw-strength-head">
                <span>Password Strength</span>
                <span className={`pw-strength-label pw-s${strength.score}`}>{strength.label}</span>
              </div>

              <div className="pw-bars" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={
                      i <= strength.score ? `pw-bar pw-bar--on pw-s${strength.score}` : 'pw-bar'
                    }
                  />
                ))}
              </div>
            </div>

            <div className="pw-rules">
              <p className="pw-rules-title">Password Requirements</p>

              {PASSWORD_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className={rule.test(form.password) ? 'pw-rule pw-rule--ok' : 'pw-rule'}
                >
                  <Check size={14} />
                  {rule.label}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="ca-field">
          <label className="ca-terms">
            <input
              id="ca-terms"
              type="checkbox"
              checked={agreed}
              aria-invalid={shown('terms') ? true : undefined}
              aria-describedby={shown('terms') ? 'ca-terms-error' : undefined}
              onChange={(e) => setAgreed(e.target.checked)}
              onBlur={touch('terms')}
            />

            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ca-purple)',
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
                  color: 'var(--ca-purple)',
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

          {shown('terms') && (
            <p className="field-error" id="ca-terms-error">
              {shown('terms')}
            </p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="ca-submit" disabled={submitting}>
          {submitting ? 'Please wait...' : 'Create account'} <ChevronRight size={18} />
        </button>
      </form>

      <p className="ca-footer">
        Have an account? <Link to="/sign-in">Sign in</Link>
      </p>

      {/* Legal Modals */}
      <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
        <TermsContent />
      </LegalModal>

      <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <PrivacyContent role={isInterpreter ? 'interpreter' : 'deaf'} />
      </LegalModal>
    </AuthShell>
  );
}
