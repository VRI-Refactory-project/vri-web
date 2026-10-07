import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { ApiError } from '../../services/api';
import { requestRecovery } from '../../services/auth';
import './AuthPages.css';

export const Forgotpassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      await requestRecovery(identifier.trim());
      // The API answers the same for unknown accounts, so we always move on to the code step.
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
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="identifier">Email or phone number</label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            className="form-input"
            placeholder="name@example.com or 0772123456"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
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
