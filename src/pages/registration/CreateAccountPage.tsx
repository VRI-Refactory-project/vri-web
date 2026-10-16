import { useState, useRef, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Award, ChevronRight } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { PhoneField } from '../../components/PhoneField';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import {
  collectErrors,
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

// V2-001 / V2-002 (deaf) and V2-003 (interpreter): the shared sign-up page.
// Deaf users: name, phone, optional email, password. Interpreters also give a required email and
// a specialisation, and go on to upload their certificates once the account exists.

const SPECIALISATIONS: { value: Specialisation; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'LEGAL', label: 'Legal' },
];

type FieldName = 'name' | 'phone' | 'email' | 'password' | 'terms';
const FIELD_ORDER: FieldName[] = ['name', 'phone', 'email', 'password', 'terms'];

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
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [specialisation, setSpecialisation] = useState<Specialisation>('GENERAL');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  // An error shows once the person has left the field, or tried to submit.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Floating video tutorial state
  const [videoDismissed, setVideoDismissed] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const set = (name: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  // Worked out from the form on every render, so a submit never reads out-of-date results.
  const errors = collectErrors<FieldName>({
    name: validateName(form.name),
    phone: validatePhoneNumber(form.phone),
    email: validateEmail(form.email, { required: isInterpreter }),
    password: validatePassword(form.password),
    terms: agreed ? undefined : 'Accept the Terms and Privacy Policy to continue.',
  });
  const shown = (name: FieldName) => (touched[name] || submitted ? errors[name] : undefined);
  const touch = (name: FieldName) => () => setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitted(true);
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      document.getElementById(`ca-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const session = isInterpreter
        ? await registerInterpreter({ ...form, specialisation })
        : await registerDeaf(form);
      login(session);
      // Interpreters upload their certificates next; the email check comes after that.
      navigate(isInterpreter ? '/register/interpreter/certifications' : '/register/welcome', {
        replace: true,
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      backTo="/get-started"
      steps={isInterpreter ? FLOWS.interpreter : FLOWS.deaf}
      current={2}
    >
      {/* ── Floating Video Tutorial ───────────────────────────── */}
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

      <form onSubmit={onSubmit} noValidate>
        {field(
          'ca-name',
          'Full name',
          <User size={16} />,
          {
            type: 'text',
            autoComplete: 'name',
            placeholder: 'Your full name',
            value: form.name,
            onChange: set('name'),
            onBlur: touch('name'),
          },
          shown('name'),
        )}
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
        {field(
          'ca-email',
          isInterpreter ? 'Email address' : 'Email address (optional)',
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
        {!isInterpreter && (
          <p className="ca-hint">
            An email lets you reset your password yourself. Without one you will need our help.
          </p>
        )}

        {isInterpreter && (
          <div className="ca-field">
            <label className="ca-label" htmlFor="ca-specialisation">
              Specialisation
            </label>
            <div className="ca-input-wrap">
              <span className="ca-input-icon">
                <Award size={16} />
              </span>
              <select
                id="ca-specialisation"
                className="ca-input"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value as Specialisation)}
              >
                {SPECIALISATIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
