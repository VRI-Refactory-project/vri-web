import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import './SignInPages.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, session } = useAuth();

  // Form & UI States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Redirect to offline page if network is disconnected
    if (!navigator.onLine) {
      sessionStorage.setItem('previousPath', location.pathname);
      navigate('/offline', { replace: true });
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email, password);
      const userRole = user?.role ?? session?.user?.role ?? 'deaf';
      const destination = dashboardPathFor(userRole);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMessage =
        apiError?.response?.data?.detail ||
        apiError?.message ||
        'We could not sign you in. Check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell steps={[]} current={0}>
      <div className="login-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 className="ca-title">Sign In</h1>
        <p className="ca-subtitle">Access your VRI platform account</p>

        {/* Error Alert Display */}
        {error && (
          <div
            className="error-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              marginBottom: '16px',
              fontSize: '14px',
            }}
            role="alert"
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Email Address Input */}
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Email address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="input-field"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  height: '42px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Password Input with Eye Toggle */}
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <label
                htmlFor="password"
                style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}
              >
                Password
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '42px',
                  height: '42px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '4px',
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              marginTop: '8px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
