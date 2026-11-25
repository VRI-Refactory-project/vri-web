import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { useAuth } from '../../hooks/useAuth';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { collectErrors, validatePassword } from '../../lib/validation';
import { ApiError } from '../../services/api';
import { acceptStaffInvitation } from '../../services/auth';
import '../registration/AuthPages.css';

type Field = 'password' | 'confirm';
const ORDER: readonly Field[] = ['password', 'confirm'];
const STAFF_ONBOARDING_KEY = 'staffInvitationOnboarding';

/** Public, one-time link used by institution staff to choose their first password. */
export function AcceptStaffInvitationPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const errors = collectErrors<Field>({
    password: validatePassword(password),
    confirm: confirm === password ? undefined : 'Passwords do not match.',
  });
  const { shown, fieldProps, check } = useFieldErrors(errors, ORDER, (name) => `invite-${name}`);

  if (!token) return <Navigate to="/sign-in" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (!check()) return;
    setSubmitting(true);
    try {
      const session = await acceptStaffInvitation(token, password);
      if (session.user.role !== 'institution' || session.user.institutionRole !== 'STAFF') {
        throw new Error('This invitation is not for an institution staff account.');
      }
      sessionStorage.setItem(STAFF_ONBOARDING_KEY, 'true');
      login(session);
      navigate('/verify-email', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'We could not accept this invitation. Ask your institution administrator to send a new one.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose your password"
      subtitle="Set a password for your institution staff account. You’ll verify your email before signing in."
      backTo="/sign-in"
    >
      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label htmlFor="invite-password">New password</label>
          <input
            {...fieldProps('password')}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError id="invite-password" message={shown('password')} />
        </div>
        <div className="form-group">
          <label htmlFor="invite-confirm">Confirm new password</label>
          <input
            {...fieldProps('confirm')}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          <FieldError id="invite-confirm" message={shown('confirm')} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set password and continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
