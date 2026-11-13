import { useState } from 'react';
import type { FormEvent } from 'react';
import { BrowserNotificationsCard } from '../../components/BrowserNotificationsCard';
import { FieldError } from '../../components/FieldError';
import { useAuth } from '../../hooks/useAuth';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { collectErrors, validatePassword, validatePasswordPresent } from '../../lib/validation';
import { describeError } from '../../services/api';
import { changePassword } from '../../services/auth';
import '../../pages/deaf/SessionsPages.css';
import './StaffPages.css';

type Field = 'current' | 'next' | 'confirm';
const ORDER: readonly Field[] = ['current', 'next', 'confirm'];

/** Staff settings: change password, browser notifications, sign out. */
export function StaffSettingsPage() {
  const { login, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = collectErrors<Field>({
    current: validatePasswordPresent(current),
    next: validatePassword(next),
    confirm: confirm === next ? undefined : 'Passwords do not match.',
  });
  const { shown, fieldProps, check } = useFieldErrors(errors, ORDER, (name) => `staff-pw-${name}`);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (!check()) return;
    setSaving(true);
    try {
      // The server signs out every device and hands back a fresh session for this one.
      login(await changePassword(current, next));
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Settings</h1>
        <p>Your password and notifications.</p>
      </header>

      <section className="sp-card" aria-labelledby="sp-pw-title">
        <h2 id="sp-pw-title">Change password</h2>
        <p>Changing it signs you out on your other devices.</p>
        <form className="sp-form" onSubmit={submit} noValidate>
          <div className="sp-field">
            <label htmlFor="staff-pw-current">Current password</label>
            <input
              {...fieldProps('current')}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <FieldError id="staff-pw-current" message={shown('current')} />
          </div>
          <div className="sp-field">
            <label htmlFor="staff-pw-next">New password</label>
            <input
              {...fieldProps('next')}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <FieldError id="staff-pw-next" message={shown('next')} />
          </div>
          <div className="sp-field">
            <label htmlFor="staff-pw-confirm">Confirm new password</label>
            <input
              {...fieldProps('confirm')}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <FieldError id="staff-pw-confirm" message={shown('confirm')} />
          </div>
          {error && (
            <p className="sp-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="sp-ok" role="status">
              Your password has been changed.
            </p>
          )}
          <button type="submit" className="sp-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>

      <BrowserNotificationsCard />

      <section className="sp-card" aria-labelledby="sp-out-title">
        <h2 id="sp-out-title">Sign out</h2>
        <p>Sign out of SignConnect on this device.</p>
        <button type="button" className="sp-btn sp-btn--danger" onClick={logout}>
          Sign out
        </button>
      </section>
    </div>
  );
}
