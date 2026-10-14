// src/pages/admin/AdminProfilePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AdminProfilePage.css';

export function AdminProfilePage() {
  const navigate = useNavigate();
  const { session, updateUser } = useAuth();

  const [name, setName] = useState(session?.user.name ?? 'Trudy');
  const [email, setEmail] = useState('trudy@signconnect.org');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';

    // Password rules only apply if the user is trying to change it
    if (newPassword) {
      if (!currentPassword) e.currentPassword = 'Enter your current password to change it';
      if (newPassword.length < 8) e.newPassword = 'Must be at least 8 characters';
      else if (!/[A-Z]/.test(newPassword)) e.newPassword = 'Needs one uppercase letter';
      else if (!/[0-9]/.test(newPassword)) e.newPassword = 'Needs one number';
    }

    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Update the signed-in user's name so the sidebar reflects the change.
    updateUser({ name: name.trim() });

    // TODO(V2-052): PATCH /api/v1/accounts/me/ with name/email/passwords once the endpoint exists.
    setCurrentPassword('');
    setNewPassword('');
    setSavedAt(new Date());
    setTimeout(() => setSavedAt(null), 4000);
  };

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1>Edit profile</h1>
          <p>Update your name, contact email, and account password.</p>
        </div>
        <button className="ap-back" onClick={() => navigate('/dashboard/admin/settings')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {savedAt && (
        <div className="ap-success">
          <CheckCircle2 size={16} /> Profile updated successfully
        </div>
      )}

      <section className="ap-card">
        <h2>Personal information</h2>
        <div className="ap-grid">
          <div className="ap-field">
            <label>Full name</label>
            <input
              className={errors.name ? 'ap-invalid' : ''}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
            />
            {errors.name && <span className="ap-msg">{errors.name}</span>}
          </div>

          <div className="ap-field">
            <label>Email</label>
            <input
              type="email"
              className={errors.email ? 'ap-invalid' : ''}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
            />
            {errors.email && <span className="ap-msg">{errors.email}</span>}
          </div>
        </div>
      </section>

      <section className="ap-card">
        <h2>Change password</h2>
        <p className="ap-hint">Leave blank to keep your current password.</p>
        <div className="ap-grid">
          <div className="ap-field">
            <label>Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              className={errors.currentPassword ? 'ap-invalid' : ''}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword) setErrors((p) => ({ ...p, currentPassword: '' }));
              }}
            />
            {errors.currentPassword && <span className="ap-msg">{errors.currentPassword}</span>}
          </div>

          <div className="ap-field">
            <label>New password</label>
            <input
              type="password"
              autoComplete="new-password"
              className={errors.newPassword ? 'ap-invalid' : ''}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: '' }));
              }}
            />
            {errors.newPassword && <span className="ap-msg">{errors.newPassword}</span>}
          </div>
        </div>
      </section>

      <div className="ap-actions">
        <button
          className="ap-btn ap-btn--ghost"
          onClick={() => navigate('/dashboard/admin/settings')}
        >
          Cancel
        </button>
        <button className="ap-btn ap-btn--primary" onClick={handleSave}>
          <Save size={15} /> Save changes
        </button>
      </div>
    </div>
  );
}
