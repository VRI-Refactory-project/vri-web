// src/pages/auth/SignInPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import {
  collectErrors,
  identifierForApi,
  validateIdentifier,
  validatePasswordPresent,
} from '../../lib/validation';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { ApiError } from '../../services/api';
import { signIn } from '../../services/auth';
import './SignInPages.css';

type FieldName = 'identifier' | 'password';
const FIELD_ORDER: readonly FieldName[] = ['identifier', 'password'];

export const SignInPage = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Sign-in checks the shape of the identifier, but never password strength: an older account
  // must still be able to get in with the password it already has.
  const errors = collectErrors<FieldName>({
    identifier: validateIdentifier(formData.identifier),
    password: validatePasswordPresent(formData.password),
  });
  const { shown, check, fieldProps } = useFieldErrors(errors, FIELD_ORDER, (name) => name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!check()) return;
    setSubmitting(true);
    try {
      const session = await signIn(identifierForApi(formData.identifier), formData.password);
      login(session);
      navigate(dashboardPathFor(session.user.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not sign you in. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign In to continue to SignConnect." backTo="/">
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
          <FieldError id="identifier" message={shown('identifier')} />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            {...fieldProps('password')}
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <FieldError id="password" message={shown('password')} />
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
          {submitting ? 'Signing in...' : 'Login'} <ChevronRight size={18} />
        </button>
      </form>

      <Link to="/forgot-password" className="login-forgot-link">
        Forgot Password?
      </Link>
    </AuthLayout>
  );
};
