import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { FieldError } from '../../components/FieldError';
import { dashboardPathFor } from '../../features/auth/roles';
import { useAuth } from '../../hooks/useAuth';
import { collectErrors, validatePassword } from '../../lib/validation';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { ApiError } from '../../services/api';
import { confirmRecovery, requestRecovery } from '../../services/auth';
import './AuthPages.css';

export const Resetpassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const identifier = (location.state as { identifier?: string } | null)?.identifier ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const errors = collectErrors<'password'>({
    password: validatePassword(password),
  });

  const { shown, fieldProps } = useFieldErrors(errors, ['password'], () => 'new-password');

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    try {
      await requestRecovery(identifier);
      alert('A new 6-digit code has been sent.');
    } catch {
      setError('Could not resend the code. Please try again.');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = otp.join('');
    if (codeString.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError(undefined);
    setIsCodeVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    // FRONTEND VALIDATION FOR BOTH PASSWORDS
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await confirmRecovery(identifier, otp.join('').trim(), password);
      login(session);
      navigate(dashboardPathFor(session.user.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not reset your password. Please check the code and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={isCodeVerified ? 'Create a new password' : 'Verify your email'}
      subtitle={
        isCodeVerified
          ? 'Choose a strong password to secure your account.'
          : 'Enter the 6-digit code sent to your email.'
      }
      backTo="/forgot-password"
    >
      {!isCodeVerified ? (
        // --- STEP 2: VERIFY OTP ---
        <form onSubmit={handleVerify} noValidate>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '16px',
                borderRadius: '50%',
                backgroundColor: '#f3f0ff',
                marginBottom: '16px',
              }}
            >
              <Mail size={32} color="#382c77" />
            </div>
          </div>

          {/* Reduced max-width of the OTP container so the card isn't too big */}
          <div style={{ maxWidth: '360px', margin: '0 auto 24px' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="form-input"
                  style={{
                    width: '44px',
                    height: '52px',
                    fontSize: '20px',
                    textAlign: 'center',
                    padding: 0,
                    fontWeight: 700,
                    backgroundColor: '#f9fafb',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="form-error" style={{ textAlign: 'center' }} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            Continue <ChevronRight size={18} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleResendCode}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b6785',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Didn't receive code?{' '}
              <span style={{ color: 'var(--color-primary)' }}>Resend Code</span>
            </button>
          </div>
        </form>
      ) : (
        // --- STEP 3: NEW PASSWORD WITH CONFIRM ---
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              >
                <Lock size={18} />
              </span>
              <input
                {...fieldProps('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '44px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError id="new-password" message={shown('password')} />
          </div>

          {/* ADDED: Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              >
                <Lock size={18} />
              </span>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%' }}
                className={
                  confirmPassword && password !== confirmPassword
                    ? 'form-input form-input--error'
                    : 'form-input'
                }
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="field-error" style={{ marginTop: '4px' }}>
                Passwords do not match.
              </p>
            )}
          </div>

          {/* FIXED: Added role="alert" here */}
          {error && (
            <p className="form-error" role="alert">
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

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setIsCodeVerified(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b6785',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Use a different code
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
