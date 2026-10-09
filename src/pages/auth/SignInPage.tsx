// src/pages/auth/SignInPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import { signIn } from '../../services/auth';
import './SignInPages.css';

export const SignInPage = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
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
    <AuthLayout title="Welcome Back" subtitle="Sign In to continue to SignConnect." backTo="/">
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="form-input"
            placeholder="Enter your password"
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
          {submitting ? 'Signing in...' : 'Login'} <ChevronRight size={18} />
        </button>
      </form>

      <Link to="/forgot-password" className="login-forgot-link">
        Forgot Password?
      </Link>
    </AuthLayout>
  );
};
