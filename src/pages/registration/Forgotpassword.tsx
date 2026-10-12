import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { collectErrors, identifierForApi, validateIdentifier } from '../../lib/validation';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { ApiError } from '../../services/api';
import { requestRecovery } from '../../services/auth';
import './AuthPages.css';

export const Forgotpassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const errors = collectErrors<'identifier'>({ identifier: validateIdentifier(identifier) });
  const { shown, check, fieldProps } = useFieldErrors(
    errors,
    ['identifier'] as const,
    () => 'identifier',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!check()) return;
    const who = identifierForApi(identifier);
    setSubmitting(true);
    try {
      await requestRecovery(who);
      // The API answers the same for unknown accounts, so we always move on to the code step.
      navigate('/reset-password', { state: { identifier: who } });
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
      backTo="/sign-in"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="identifier">Email or phone number</label>
          <input
            {...fieldProps('identifier')}
            type="text"
            autoComplete="username"
            placeholder="name@example.com or +256 772 123 456"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <FieldError id="identifier" message={shown('identifier')} />
        </div>

        {error && (
          <p role="alert" className="form-error">
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
