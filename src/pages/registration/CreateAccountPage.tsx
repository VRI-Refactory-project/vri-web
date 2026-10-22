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
import {
  PASSWORD_RULES,
  collectErrors,
  getPasswordStrength,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from '../../lib/validation';
import { describeError } from '../../services/api';
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

  // Multi-select State
  const [specialisations, setSpecialisations] = useState<Specialisation[]>([]);
  const [customSpecialisation, setCustomSpecialisation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [videoDismissed, setVideoDismissed] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close dropdown when clicking outside
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

  // Recalculated on every keystroke: drives the strength bars and the green ticks.
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

    setSubmitting(true);
    try {
      // confirmPassword is deliberately left out: the API never needs it.
      const registrationData = {
        name: `${form.firstname.trim()} ${form.lastname.trim()}`,
        phone: form.phone,
        email: form.email,
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

  // Get the text to show inside the dropdown box
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
        {/* Row: First name | Last name */}
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

        {/* Email on its own row */}
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
            onBlur: touch('email'),
          },
          shown('email'),
        )}

        {/* Phone on its own row */}
        <div className="ca-field">
          <label className="ca-label" htmlFor="ca-phone">
            Phone number
          </label>
          <PhoneField
            id="ca-phone"
            value={form.phone}
            onChange={(phone) => setForm((f) => ({ ...f, phone }))}
            onBlur={touch('phone')}
            invalid={Boolean(shown('phone'))}
            errorId={shown('phone') ? 'ca-phone-error' : undefined}
          />
          {shown('phone') && (
            <p className="field-error" id="ca-phone-error">
              {shown('phone')}
            </p>
          )}
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        {isInterpreter && (
          <div className="ca-field" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="ca-label">Specialisation(s)</label>

            {/* The Box that looks like an input */}
            <div
              className="ca-input-wrap"
              onClick={() => {
                // Only open the dropdown if we are not currently typing in "Other"
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
                /* IF "OTHER" IS SELECTED: Show the text input inside the box */
                <input
                  type="text"
                  className="ca-input"
                  placeholder="Type your specialisation..."
                  value={customSpecialisation}
                  onChange={(e) => setCustomSpecialisation(e.target.value)}
                  autoFocus
                  style={{ paddingRight: '40px' }} // Make room for the icon
                />
              ) : (
                /* OTHERWISE: Show the normal dropdown text */
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
                  <span style={{ color: specialisations.length === 0 ? '#9ca3af' : '#111827' }}>
                    {getSelectedLabel()}
                  </span>
                </div>
              )}

              {/* The Chevron Icon (Always visible on the right) */}
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

            {/* The Dropdown Menu (Only shows if NOT in "Other" mode) */}
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
                      // If they click "Other", close the menu so they can type in the box
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

            {/* A small button to go back to the list if they made a mistake */}
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

        {/* Row: Password | Confirm password */}
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

          {/* One eye button (above) shows or hides both password boxes */}
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

        {/* Strength bars + requirement ticks: appear once the person starts typing a password */}
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
              I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
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
    </AuthShell>
  );
}
