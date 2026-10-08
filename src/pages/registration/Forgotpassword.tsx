import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { useValidation } from '../../hooks/useValidation';
import { ApiError } from '../../services/api';
import { requestRecovery } from '../../services/auth';
import './AuthPages.css';

export const Forgotpassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { validateEmail, validatePhone } = useValidation();

  const validateIdentifier = (value: string): string | null => {
    if (!value.trim()) return 'Email or phone number is required';
    if (value.includes('@')) return validateEmail(value);
    return validatePhone(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    if (touched) setFieldError(validateIdentifier(value));
  };

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateIdentifier(identifier));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const idError = validateIdentifier(identifier);
    setTouched(true);
    setFieldError(idError);
    if (idError) return;

    setSubmitting(true);
    try {
      await requestRecovery(identifier.trim());
      navigate('/reset-password', { state: { identifier: identifier.trim() } });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not send the code. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email or phone number and we'll email you a 6-digit code"
      onBack={() => navigate('/sign-in')}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="identifier">Email or phone number</label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            className={`form-input ${
              touched && fieldError ? 'input-error' : ''
            } ${touched && !fieldError && identifier ? 'input-success' : ''}`}
            placeholder="name@example.com or 0772123456"
            value={identifier}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched && fieldError && (
            <span className="input-error-text">{fieldError}</span>
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
          style={{ marginTop: '8px' }}
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send code'} <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};