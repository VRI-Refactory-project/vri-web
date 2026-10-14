// src/pages/deaf/ProfilePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  X,
  Mail,
  Phone,
  MapPin,
  Bell,
  MessageCircle,
  Sparkles,
  Eye,
  Pencil,
  Save,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './ProfilePage.css';

interface DeafProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  languages: string[];
  emergencyName: string;
  emergencyPhone: string;
  emailNotifications: boolean;
  chatAlerts: boolean;
  flashAlerts: boolean;
  publicProfile: boolean;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const fullName = session?.user.name ?? 'Michael Kiggundu';
  const [first = 'Michael', last = 'Kiggundu'] = fullName.split(' ');
  const initial = (first[0] ?? 'M').toUpperCase();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DeafProfile>({
    firstName: first,
    lastName: last,
    email: 'michael@gmail.com',
    phone: '+256 700 123 456',
    location: 'Kampala, Uganda',
    languages: ['Ugandan Sign Language', 'English (text)', 'International Sign'],
    emergencyName: 'Sarah Kiggundu',
    emergencyPhone: '+256 771 987 654',
    emailNotifications: true,
    chatAlerts: true,
    flashAlerts: true,
    publicProfile: false,
  });

  const set = <K extends keyof DeafProfile>(k: K, v: DeafProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const removeLanguage = (lang: string) =>
    set(
      'languages',
      form.languages.filter((l) => l !== lang),
    );

  return (
    <div className="pr-page">
      <div className="pr-header">
        <div>
          <h1>{editing ? 'Edit Profile' : 'Profile'}</h1>
          <p>Manage your personal information and preferences.</p>
        </div>
        <button className="pr-back" onClick={() => navigate('/dashboard/deaf')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="pr-columns">
        {/* LEFT */}
        <div className="pr-left">
          <div className="pr-card">
            <div className="pr-photo">
              <span className="pr-avatar">{initial}</span>
              <div className="pr-photo-actions">
                <button>
                  <Camera size={14} /> Change photo
                </button>
                <button>
                  <X size={14} /> Remove
                </button>
              </div>
            </div>
          </div>

          <div className="pr-card">
            <h2>Profile details</h2>
            <div className="pr-grid">
              <div className="pr-field">
                <label>Full name</label>
                <input
                  value={`${form.firstName} ${form.lastName}`}
                  readOnly={!editing}
                  onChange={(e) => {
                    const [f, ...rest] = e.target.value.split(' ');
                    set('firstName', f ?? '');
                    set('lastName', rest.join(' '));
                  }}
                />
              </div>
              <div className="pr-field">
                <label>Preferred name</label>
                <input
                  value={form.firstName}
                  readOnly={!editing}
                  onChange={(e) => set('firstName', e.target.value)}
                />
              </div>
              <div className="pr-field">
                <label>Email</label>
                <div className="pr-input">
                  <Mail size={14} />
                  <input
                    type="email"
                    value={form.email}
                    readOnly={!editing}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="pr-field">
                <label>Phone number</label>
                <div className="pr-input">
                  <Phone size={14} />
                  <input
                    value={form.phone}
                    readOnly={!editing}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="pr-field pr-field--full">
                <label>Location</label>
                <div className="pr-input">
                  <MapPin size={14} />
                  <input
                    value={form.location}
                    readOnly={!editing}
                    onChange={(e) => set('location', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pr-card">
            <h2>Sign language preference</h2>
            <div className="pr-chips">
              {form.languages.map((l) => (
                <span key={l} className="pr-chip">
                  {l}
                  {editing && (
                    <button onClick={() => removeLanguage(l)} aria-label={`Remove ${l}`}>
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="pr-card">
            <h2>
              <Heart size={15} /> Emergency contact
            </h2>
            <div className="pr-grid">
              <div className="pr-field">
                <label>Name</label>
                <input
                  value={form.emergencyName}
                  readOnly={!editing}
                  onChange={(e) => set('emergencyName', e.target.value)}
                />
              </div>
              <div className="pr-field">
                <label>Phone</label>
                <input
                  value={form.emergencyPhone}
                  readOnly={!editing}
                  onChange={(e) => set('emergencyPhone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="pr-right">
          <div className="pr-card">
            <h2>
              <Sparkles size={15} /> How I communicate
            </h2>
            <ul className="pr-list">
              <li>
                ✓ Ugandan Sign Language <span className="pr-tag">Main</span>
              </li>
              <li>✓ English (text)</li>
              <li>✓ International Sign</li>
            </ul>
            <p className="pr-hint">Interpreters see this before they accept your session.</p>
          </div>

          <div className="pr-card">
            <h2>
              <Bell size={15} /> Preferences
            </h2>
            <div className="pr-prefs">
              {(
                [
                  ['emailNotifications', 'Email notifications', Bell],
                  ['chatAlerts', 'Chat message alerts', MessageCircle],
                  ['flashAlerts', 'Flash alert for calls', Sparkles],
                  ['publicProfile', 'Show profile publicly', Eye],
                ] as const
              ).map(([k, label, Icon]) => (
                <div key={k} className="pr-pref">
                  <span>
                    <Icon size={14} /> {label}
                  </span>
                  <button
                    className={`pr-switch ${form[k] ? 'pr-switch--on' : ''}`}
                    disabled={!editing}
                    onClick={() => set(k, !form[k])}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pr-actions">
        {editing ? (
          <>
            <button className="pr-btn pr-btn--ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="pr-btn pr-btn--primary" onClick={() => setEditing(false)}>
              <Save size={15} /> Save changes
            </button>
          </>
        ) : (
          <button className="pr-btn pr-btn--primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit profile
          </button>
        )}
      </div>
    </div>
  );
}
