// src/pages/admin/AdminProfilePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SignOutButton } from '../../components/SignOutButton';
import {
  fetchAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from '../../services/adminSettings';
import { describeError } from '../../services/api';
import './AdminProfilePage.css';

export function AdminProfilePage() {
  const navigate = useNavigate();
  const { session, updateUser } = useAuth();

  const [name, setName] = useState(session?.user.name ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    fetchAdminProfile()
      .then((p) => {
        setName(p.name);
        setEmail(p.email);
        setPhone(p.phone);
      })
      .catch((err) => {
        setBanner(describeError(err));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (phone.trim() && !/^[+0-9 ()-]+$/.test(phone)) e.phone = 'Use digits, +, spaces or dashes';

    if (newPassword) {
      if (!currentPassword) e.currentPassword = 'Enter your current password to change it';
      if (newPassword.length < 8) e.newPassword = 'Must be at least 8 characters';
      else if (!/[A-Z]/.test(newPassword)) e.newPassword = 'Needs one uppercase letter';
      else if (!/[0-9]/.test(newPassword)) e.newPassword = 'Needs one number';
    }
    return e;
  }

  async function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    setBanner('');

    try {
      const updated = await updateAdminProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setName(updated.name);
      setEmail(updated.email);
      setPhone(updated.phone);
      updateUser({ name: updated.name });

      if (newPassword) {
        await changeAdminPassword({ currentPassword, newPassword });
        setCurrentPassword('');
        setNewPassword('');
      }

      setNotice('Profile updated successfully.');
    } catch (err) {
      setBanner(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1>Edit profile</h1>
          <p>Update your name, contact email, phone number, and account password.</p>
        </div>
        <button className="ap-back" onClick={() => navigate('/dashboard/admin/settings')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {notice && (
        <div className="ap-success">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
      {banner && <div className="ap-banner-error">{banner}</div>}

      <section className="ap-card">
        <h2>Personal information</h2>
        <div className="ap-grid">
          <div className="ap-field">
            <label>Full name</label>
            <input
              className={errors.name ? 'ap-invalid' : ''}
              value={name}
              disabled={loading}
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
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
            />
            {errors.email && <span className="ap-msg">{errors.email}</span>}
          </div>

          <div className="ap-field ap-field--full">
            <label>Phone number</label>
            <input
              type="tel"
              className={errors.phone ? 'ap-invalid' : ''}
              value={phone}
              disabled={loading}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((p) => ({ ...p, phone: '' }));
              }}
            />
            {errors.phone && <span className="ap-msg">{errors.phone}</span>}
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
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="ap-btn ap-btn--primary"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
      <SignOutButton />
    </div>
  );
}
