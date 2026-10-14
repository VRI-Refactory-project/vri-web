// src/pages/admin/SettingsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './SettingsPage.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const name = session?.user.name ?? 'Trudy';
  const initial = name.trim().charAt(0).toUpperCase() || 'T';

  const [sessionAlerts, setSessionAlerts] = useState(true);
  const [verificationAlerts, setVerificationAlerts] = useState(true);
  const [oneStep, setOneStep] = useState(true);

  return (
    <div className="st-page">
      <div className="st-header">
        <h1>Settings</h1>
        <p>Manage your administrator profile, notifications and secure access</p>
      </div>

      {/* Administrator profile */}
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

      {/* Notifications */}
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
            className={`st-switch ${sessionAlerts ? 'st-switch--on' : ''}`}
            aria-label="Toggle session alerts"
            onClick={() => setSessionAlerts((v) => !v)}
          />
        </div>

        <div className="st-row">
          <div>
            <strong>Verification alerts</strong>
            <p>New interpreter and institution applications</p>
          </div>
          <button
            type="button"
            className={`st-switch ${verificationAlerts ? 'st-switch--on' : ''}`}
            aria-label="Toggle verification alerts"
            onClick={() => setVerificationAlerts((v) => !v)}
          />
        </div>
      </section>

      {/* Security */}
      <section className="st-card">
        <div className="st-card-head">
          <h2>Security</h2>
          <p>Protect your administrator access</p>
        </div>

        <div className="st-row">
          <div>
            <strong>Password</strong>
            <p>Last changed 12 days ago</p>
          </div>
          <button
            type="button"
            className="st-btn st-btn--primary"
            onClick={() => navigate('/forgot-password')}
          >
            Change password
          </button>
        </div>

        <div className="st-row">
          <div>
            <strong>One-step verification</strong>
            <p>Enabled for this account</p>
          </div>
          <button
            type="button"
            className={`st-switch ${oneStep ? 'st-switch--on' : ''}`}
            aria-label="Toggle one-step verification"
            onClick={() => setOneStep((v) => !v)}
          />
        </div>
      </section>
    </div>
  );
}
