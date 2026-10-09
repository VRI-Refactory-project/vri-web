import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import { confirmRecovery } from '../../services/auth';
import './AuthPages.css';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      // On success the API also signs the user in, so go straight to their dashboard.
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
      backTo="/forgot-password"
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
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="form-input"
            placeholder="123456"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className="form-input"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          style={{ marginTop: '16px' }}
          disabled={submitting}
        >
          {submitting ? 'Resetting...' : 'Reset password'} <ChevronRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
};
