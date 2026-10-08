// src/pages/auth/SignInPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { useValidation } from '../../hooks/useValidation';
import { ApiError } from '../../services/api';
import { signIn } from '../../services/auth';
import './SignInPages.css';

export const SignInPage = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const { validateEmail, validatePhone } = useValidation();

  const validateIdentifier = (value: string): string | null => {
    if (!value.trim()) return 'Email or phone number is required';
    if (value.includes('@')) return validateEmail(value);
    return validatePhone(value);
  };

  const handleChange = (field: 'identifier' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      if (field === 'identifier') {
        setErrors((prev) => ({ ...prev, identifier: validateIdentifier(value) }));
      } else {
        setErrors((prev) => ({
          ...prev,
          password: value ? null : 'Password is required',
        }));
      }
    }
  };

  const handleBlur = (field: 'identifier' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'identifier') {
      setErrors((prev) => ({
        ...prev,
        identifier: validateIdentifier(formData.identifier),
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        password: formData.password ? null : 'Password is required',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const idError = validateIdentifier(formData.identifier);
    const pwError = formData.password ? null : 'Password is required';
    setTouched({ identifier: true, password: true });
    setErrors({ identifier: idError, password: pwError });
    if (idError || pwError) return;

    setSubmitting(true);
    try {
      const session = await signIn(formData.identifier.trim(), formData.password);
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
    <div className="login-page-container">
      <div className="login-logo-floating">
        <img src="/logo.png" alt="SignConnect Logo" />
      </div>

      <button className="login-back-button" onClick={() => window.history.back()}>
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      <div className="login-card-wrapper">
        <AuthLayout
          title="Welcome Back"
          subtitle="Sign In to continue to SignConnect."
          onBack={() => console.log('Do nothing here')}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier">Email or phone number</label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className={`form-input ${
                  touched.identifier && errors.identifier ? 'input-error' : ''
                } ${
                  touched.identifier && !errors.identifier && formData.identifier
                    ? 'input-success'
                    : ''
                }`}
                placeholder="name@example.com or 0772123456"
                value={formData.identifier}
                onChange={(e) => handleChange('identifier', e.target.value)}
                onBlur={() => handleBlur('identifier')}
              />
              {touched.identifier && errors.identifier && (
                <span className="input-error-text">{errors.identifier}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`form-input ${
                  touched.password && errors.password ? 'input-error' : ''
                } ${
                  touched.password && !errors.password && formData.password
                    ? 'input-success'
                    : ''
                }`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
              />
              {touched.password && errors.password && (
                <span className="input-error-text">{errors.password}</span>
              )}
            </div>

            {error && (
              <p role="alert" style={{ color: '#b91c1c', marginTop: '12px' }}>
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

          <div className="step-indicator" style={{ marginTop: '32px' }}>
            <div className="step active"></div>
            <div className="step active"></div>
            <div className="step active"></div>
            <p className="step-text">Step 3 of 3</p>
          </div>
        </AuthLayout>
      </div>
    </div>
  );
};