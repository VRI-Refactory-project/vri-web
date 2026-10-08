import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { useValidation } from '../../hooks/useValidation';
import { ApiError } from '../../services/api';
import { confirmRecovery } from '../../services/auth';
import './AuthPages.css';

export const Resetpassword = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    identifier: (location.state as { identifier?: string } | null)?.identifier ?? '',
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const { validateEmail, validatePhone, validatePassword, validateConfirmPassword } = useValidation();

  const validateIdentifier = (value: string): string | null => {
    if (!value.trim()) return 'Email or phone number is required';
    if (value.includes('@')) return validateEmail(value);
    return validatePhone(value);
  };

  const validateCode = (value: string): string | null => {
    if (!value.trim()) return 'Code is required';
    if (!/^\d{6}$/.test(value.trim())) return 'Code must be 6 digits';
    return null;
  };

  const validateField = (field: string, value: string) => {
    let err: string | null = null;
    switch (field) {
      case 'identifier':
        err = validateIdentifier(value);
        break;
      case 'code':
        err = validateCode(value);
        break;
      case 'password':
        err = validatePassword(value);
        break;
      case 'confirmPassword':
        err = validateConfirmPassword(formData.password, value);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {},
    );
    setTouched(allTouched);

    let hasError = false;
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key as keyof typeof formData]);
      const val = formData[key as keyof typeof formData];
      if (!val || errors[key]) hasError = true;
    });

    if (hasError) {
      setError('Please fix the errors above.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await confirmRecovery(
        formData.identifier.trim(),
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
      onBack={() => navigate('/forgot-password')}
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
              touched.identifier && !errors.identifier ? 'input-success' : ''
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
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`form-input ${
              touched.code && errors.code ? 'input-error' : ''
            } ${touched.code && !errors.code ? 'input-success' : ''}`}
            placeholder="123456"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            onBlur={() => handleBlur('code')}
          />
          {touched.code && errors.code && (
            <span className="input-error-text">{errors.code}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className={`form-input ${
              touched.password && errors.password ? 'input-error' : ''
            } ${touched.password && !errors.password ? 'input-success' : ''}`}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
          />
          {touched.password && errors.password && (
            <span className="input-error-text">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            className={`form-input ${
              touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''
            } ${
              touched.confirmPassword && !errors.confirmPassword ? 'input-success' : ''
            }`}
            placeholder="Re-enter your new password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="input-error-text">{errors.confirmPassword}</span>
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
          {submitting ? 'Resetting...' : 'Reset password'} <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};