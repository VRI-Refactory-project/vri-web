// src/pages/admin/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAdminPreferences,
  updateAdminPreferences,
  type AdminPreferences,
} from '../../services/adminSettings';
import { describeError } from '../../services/api';
import './SettingsPage.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const name = session?.user.name ?? 'Administrator';
  const initial = name.trim().charAt(0).toUpperCase() || 'A';

  const [prefs, setPrefs] = useState<AdminPreferences>({
    sessionAlerts: true,
    verificationAlerts: true,
    oneStepVerification: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');
  const [bannerKind, setBannerKind] = useState<'error' | 'success'>('error');

  useEffect(() => {
    fetchAdminPreferences()
      .then((p) => {
        setPrefs(p);
        setLoaded(true);
      })
      .catch(() => {
        setBanner('Could not load preferences from the server.');
        setBannerKind('error');
      });
  }, []);

  useEffect(() => {
    if (!banner || bannerKind !== 'success') return;
    const t = window.setTimeout(() => setBanner(''), 3500);
    return () => window.clearTimeout(t);
  }, [banner, bannerKind]);

  async function toggle<K extends keyof AdminPreferences>(key: K, value: boolean) {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setSaving(true);
    setBanner('');
    try {
      const updated = await updateAdminPreferences({ [key]: value });
      setPrefs(updated);
      setBanner('Preferences saved.');
      setBannerKind('success');
    } catch (err) {
      setPrefs(previous);
      setBanner(describeError(err));
      setBannerKind('error');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    const confirmed = window.confirm(
      'Are you sure you want to log out of your administrator account?',
    );

    if (!confirmed) return;

    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="st-page">
      <div className="st-header">
        <h1>Settings</h1>
        <p>Manage your administrator profile, notifications and secure access</p>
      </div>

      {banner && (
        <div
          className={`st-banner ${bannerKind === 'success' ? 'st-banner--success' : 'st-banner--error'}`}
          role={bannerKind === 'error' ? 'alert' : 'status'}
        >
          {banner}
        </div>
      )}

      <section className="st-card">
        <div className="st-card-head">
          <h2>Administrator profile</h2>
          <p>Your account information</p>
        </div>
        <div className="st-profile">
          <span className="st-avatar">{initial}</span>
          <div className="st-profile-info">
            <strong>{name}</strong>
            <small>Platform administrator</small>
          </div>
          <button
            type="button"
            className="st-btn st-btn--primary"
            onClick={() => navigate('/dashboard/admin/profile')}
          >
            Edit profile
          </button>
        </div>
      </section>

      <section className="st-card">
        <div className="st-card-head">
          <h2>Notifications</h2>
          <p>Choose which operational updates you receive</p>
        </div>

        <div className="st-row">
          <div>
            <strong>Session alerts</strong>
            <p>Connection failures and sessions needing attention</p>
          </div>
          <button
            type="button"
            className={`st-switch ${prefs.sessionAlerts ? 'st-switch--on' : ''}`}
            aria-label="Toggle session alerts"
            disabled={!loaded || saving}
            onClick={() => void toggle('sessionAlerts', !prefs.sessionAlerts)}
          />
        </div>

        <div className="st-row">
          <div>
            <strong>Verification alerts</strong>
            <p>New interpreter and institution applications</p>
          </div>
          <button
            type="button"
            className={`st-switch ${prefs.verificationAlerts ? 'st-switch--on' : ''}`}
            aria-label="Toggle verification alerts"
            disabled={!loaded || saving}
            onClick={() => void toggle('verificationAlerts', !prefs.verificationAlerts)}
          />
        </div>
      </section>

      <section className="st-card">
        <div className="st-card-head">
          <h2>Security</h2>
          <p>Protect your administrator access</p>
        </div>

        <div className="st-row">
          <div>
            <strong>Password</strong>
            <p>Change your administrator password</p>
          </div>
          <button
            type="button"
            className="st-btn st-btn--primary"
            onClick={() => navigate('/dashboard/admin/profile')}
          >
            Change password
          </button>
        </div>

        <div className="st-row">
          <div>
            <strong>One-step verification</strong>
            <p>
              {prefs.oneStepVerification ? 'Enabled for this account' : 'Disabled for this account'}
            </p>
          </div>
          <button
            type="button"
            className={`st-switch ${prefs.oneStepVerification ? 'st-switch--on' : ''}`}
            aria-label="Toggle one-step verification"
            disabled={!loaded || saving}
            onClick={() => void toggle('oneStepVerification', !prefs.oneStepVerification)}
          />
        </div>
      </section>

      {/* Logout */}
      <section className="st-card st-logout-card">
        <div className="st-card-head">
          <h2>Sign out</h2>
          <p>End your administrator session securely.</p>
        </div>

        <div className="st-row">
          <div>
            <strong>Logout from your account</strong>
            <p>You will need to sign in again to access the administrator dashboard.</p>
          </div>

          <button type="button" className="st-btn st-btn--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}
