import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { collectErrors, validatePassword, validatePasswordPresent } from '../../lib/validation';
import { ApiError } from '../../services/api';
import { changePassword } from '../../services/auth';
import '../registration/AuthPages.css';

type Field = 'current' | 'next' | 'confirm';
const ORDER: readonly Field[] = ['current', 'next', 'confirm'];

/** First sign-in for staff made by an institution: swap the one-time password for their own. */
export function ChangeTemporaryPasswordPage() {
  const { session, checking, login } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const errors = collectErrors<Field>({
    current: validatePasswordPresent(current),
    next: validatePassword(next),
    confirm: confirm === next ? undefined : 'Passwords do not match.',
  });
  const { shown, fieldProps, check } = useFieldErrors(errors, ORDER, (name) => `change-${name}`);

  if (checking) return null;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!session.user.mustChangePassword) {
    return (
      <Navigate to={dashboardPathFor(session.user.role, session.user.institutionRole)} replace />
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!check()) return;
    setSubmitting(true);
    try {
      const updated = await changePassword(current, next);
      login(updated);
      navigate(dashboardPathFor(updated.user.role, updated.user.institutionRole), {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not change your password. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose your own password"
      subtitle="You signed in with a one-time password. Set a new one to continue."
      backTo="/sign-in"
    >
      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label htmlFor="change-current">One-time password</label>
          <input
            {...fieldProps('current')}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <FieldError id="change-current" message={shown('current')} />
        </div>
        <div className="form-group">
          <label htmlFor="change-next">New password</label>
          <input
            {...fieldProps('next')}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <FieldError id="change-next" message={shown('next')} />
        </div>
        <div className="form-group">
          <label htmlFor="change-confirm">Confirm new password</label>
          <input
            {...fieldProps('confirm')}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <FieldError id="change-confirm" message={shown('confirm')} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
