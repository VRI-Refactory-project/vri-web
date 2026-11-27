import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

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
import type { AuthUser } from '../../types';
import { signIn } from '../../services/auth';

import './SignInPages.css';

type FieldName = 'identifier' | 'password';

const FIELD_ORDER: readonly FieldName[] = ['identifier', 'password'];

function destinationFor(user: AuthUser, from: unknown): string {
  if (user.role === 'institution' && user.institutionRole === 'STAFF' && user.mustChangePassword)
    return '/change-password';
  const home = dashboardPathFor(user.role, user.institutionRole);

  return typeof from === 'string' && (from === home || from.startsWith(`${home}/`)) ? from : home;
}

export const SignInPage = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { session, sessionExpired, login } = useAuth();

  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // Configure this URL when the backend Google OAuth endpoint is ready.
  const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL;

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

      if (session.user.role === 'institution' && session.user.institutionRole === 'STAFF') {
        sessionStorage.removeItem('staffPasswordChangeDeferred');
      }
      login(session);
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

  const handleGoogleLogin = () => {
    if (!googleAuthUrl) {
      setError('Google sign-in is not configured yet. Please use email or phone login.');
      return;
    }

    window.location.assign(googleAuthUrl);
  };

  if (session) {
    return <Navigate to={destinationFor(session.user, from)} replace />;
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to Sign Connect"
      backTo="/"
      className="as-page--sign-in"
    >
      <form onSubmit={handleSubmit} noValidate className="sign-in-form">
        {sessionExpired && (
          <p role="status" className="login-notice">
            Your session has ended. Please sign in again.
          </p>
        )}

        <div className="form-group">
          <label htmlFor="identifier">Email or phone number</label>

          <input
            {...fieldProps('identifier')}
            type="text"
            autoComplete="username"
            placeholder="Enter your email or phone number"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          />

          <FieldError id="identifier" message={shown('identifier')} />
        </div>

        <div className="form-group sign-in-password-group">
          <label htmlFor="password">Password</label>

          <div className="password-field">
            <input
              {...fieldProps('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <FieldError id="password" message={shown('password')} />

          <Link to="/forgot-password" className="login-forgot-link">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary login-submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>

        <p className="login-legal">
          By signing in, you agree to our <Link to="/terms">Terms of Use</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </form>

      <div className="login-divider">
        <span>OR CONTINUE WITH</span>
      </div>

      <button type="button" className="google-login-button" onClick={handleGoogleLogin}>
        <span className="google-letter" aria-hidden="true">
          G
        </span>
        Continue with Google
      </button>

      <p className="login-signup-link">
        Don't have an account? <Link to="/get-started">Sign up</Link>
      </p>
    </AuthLayout>
  );
};
