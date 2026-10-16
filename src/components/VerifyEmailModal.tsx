import { useEffect, useState, type FormEvent } from 'react';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { confirmEmailCode, resendEmailCode } from '../services/auth';
import { describeError } from '../services/api';
import { Modal } from './Modal';

const RESEND_WAIT_SECONDS = 60;

/**
 * Pop-up asking the signed-in user to enter the 6-digit code emailed to them. It shows only for
 * an account that has an email address which is not yet verified, and can be put off for now.
 */
export function VerifyEmailModal({
  required = false,
  onSignOut,
}: {
  /** True on the full-page step: the pop-up cannot be put off and the resend wait is not applied. */
  required?: boolean;
  /** Shown only when `required`, so someone with the wrong account is not stuck on this step. */
  onSignOut?: () => void;
}) {
  const { session, updateUser } = useAuth();
  const user = session?.user;
  const [dismissed, setDismissed] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(required ? 0 : RESEND_WAIT_SECONDS);

  // The code was just emailed when the account was created, so the first resend waits a minute.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (!user || !user.email || user.emailVerified !== false || dismissed) return null;

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
      <div className="modal__icon">
        <MailCheck size={28} aria-hidden="true" />
      </div>
      <h2 className="modal__title">Verify your email</h2>
      <p className="modal__text">
        We sent a 6-digit code to <strong>{user.email}</strong>. Enter it to confirm this address is
        yours. Accounts need a verified email before they can be approved.
      </p>
      <form onSubmit={submit} noValidate>
        <input
          className={`modal__code${error ? ' modal__code--invalid' : ''}`}
          aria-label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {info && <p className="modal__info">{info}</p>}
        <button className="modal__primary" type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Verify email'}
        </button>
      </form>
      <button className="modal__secondary" type="button" onClick={resend} disabled={wait > 0}>
        {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
      </button>
      {required ? (
        onSignOut && (
          <button className="modal__secondary" type="button" onClick={onSignOut}>
            Use a different account
          </button>
        )
      ) : (
        <button className="modal__secondary" type="button" onClick={() => setDismissed(true)}>
          Not now
        </button>
      )}
    </Modal>
  );
}
