import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { confirmEmailCode, resendEmailCode } from '../services/auth';
import { describeError } from '../services/api';
import { Modal } from './Modal';
import illustration from '../assets/verify-email-illustration.png';
import './VerifyEmailModal.css';

const RESEND_WAIT_SECONDS = 60;
const CODE_LENGTH = 6;

/**
 * Pop-up asking the signed-in user to enter the 6-digit code emailed to them.
 */
export function VerifyEmailModal({
  required = false,
  onSignOut,
}: {
  required?: boolean;
  onSignOut?: () => void;
}) {
  const { session, updateUser } = useAuth();
  const user = session?.user;

  const [dismissed, setDismissed] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(required ? 0 : RESEND_WAIT_SECONDS);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  // Focus first box on mount (only when the modal is actually visible)
  useEffect(() => {
    if (user && user.email && user.emailVerified === false && !dismissed) {
      requestAnimationFrame(() => inputsRef.current[0]?.focus());
    }
  }, [user, dismissed]);

  if (!user || !user.email || user.emailVerified !== false || dismissed) return null;

  const code = digits.join('');

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    // If user pastes multiple digits into one box, spread them
    if (clean.length > 1) {
      const chars = clean.slice(0, CODE_LENGTH - index).split('');
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => {
          if (index + i < CODE_LENGTH) next[index + i] = c;
        });
        return next;
      });
      const focusIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });

    // Auto-advance
    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // clear current
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        // move back and clear previous
        inputsRef.current[index - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    const chars = text.slice(0, CODE_LENGTH - index).split('');
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = c;
      });
      return next;
    });
    const focusIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const verified = await confirmEmailCode(code);
      updateUser({ emailVerified: verified.emailVerified ?? true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    try {
      const res = await resendEmailCode();
      setInfo(res.detail);
      setWait(RESEND_WAIT_SECONDS);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <Modal title="Verify your email" onClose={required ? undefined : () => setDismissed(true)}>
      <div className="verify-modal">
        <img className="verify-modal__illustration" src={illustration} alt="" aria-hidden="true" />

        <h2 className="verify-modal__title">Verify your email</h2>

        <p className="verify-modal__text">
          We sent a 6-digit code to <strong>{user.email}</strong>. Enter it to confirm this address
          is yours. Accounts need a verified email before they can be approved.
        </p>

        <form onSubmit={submit} noValidate>
          <div className="verify-modal__otp" role="group" aria-label="6-digit code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                className={`verify-modal__otp-box${error ? ' verify-modal__otp-box--invalid' : ''}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                placeholder="—"
                onChange={(e) => setDigit(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(index, e)}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {info && <p className="verify-modal__info">{info}</p>}

          <button className="verify-modal__primary" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Verify email'}
          </button>
        </form>

        <div className="verify-modal__links">
          <button className="verify-modal__link" type="button" onClick={resend} disabled={wait > 0}>
            {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
          </button>

          {required && onSignOut ? (
            <button className="verify-modal__link" type="button" onClick={onSignOut}>
              Use a different account
            </button>
          ) : (
            !required && (
              <button
                className="verify-modal__link"
                type="button"
                onClick={() => setDismissed(true)}
              >
                Not now
              </button>
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
