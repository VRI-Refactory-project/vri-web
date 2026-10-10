import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import {
  collectErrors,
  identifierForApi,
  sanitizeCodeInput,
  validateCode,
  validateIdentifier,
  validatePassword,
} from '../../lib/validation';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { ApiError } from '../../services/api';
import { confirmRecovery } from '../../services/auth';
import './AuthPages.css';

type FieldName = 'identifier' | 'code' | 'password';
const FIELD_ORDER: readonly FieldName[] = ['identifier', 'code', 'password'];
const ids: Record<FieldName, string> = {
  identifier: 'identifier',
  code: 'code',
  password: 'new-password',
};

export const Resetpassword = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    identifier: (location.state as { identifier?: string } | null)?.identifier ?? '',
    code: '',
    password: '',
  });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // The new password follows the same rules as when creating an account.
  const errors = collectErrors<FieldName>({
    identifier: validateIdentifier(formData.identifier),
    code: validateCode(formData.code),
    password: validatePassword(formData.password),
  });
  const { shown, check, fieldProps } = useFieldErrors(errors, FIELD_ORDER, (name) => ids[name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!check()) return;
    setSubmitting(true);
    try {
      // On success the API also signs the user in, so go straight to their dashboard.
      const session = await confirmRecovery(
        identifierForApi(formData.identifier),
        formData.code.trim(),
        formData.password,
      );
      login(session);
      navigate(dashboardPathFor(session.user.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not reset your password. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Select a new password"
      subtitle="Enter the 6-digit code from your email and choose a new password"
      backTo="/forgot-password"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="identifier">Email or phone number</label>
          <input
            {...fieldProps('identifier')}
            type="text"
            autoComplete="username"
            placeholder="name@example.com or +256 772 123 456"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          />
          <FieldError id={ids.identifier} message={shown('identifier')} />
        </div>

        <div className="form-group">
          <label htmlFor="code">6-digit code</label>
          <input
            {...fieldProps('code')}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: sanitizeCodeInput(e.target.value) })}
          />
          <FieldError id={ids.code} message={shown('code')} />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            {...fieldProps('password')}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <FieldError id={ids.password} message={shown('password')} />
        </div>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '16px' }}
          disabled={submitting}
        >
          {submitting ? 'Resetting...' : 'Reset password'} <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};
