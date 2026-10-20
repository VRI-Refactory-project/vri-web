// src/pages/deaf/ProfilePage.tsx
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  X,
  Plus,
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
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  fetchMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  type MyProfile,
} from '../../services/deafProfile';
import { describeError } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './ProfilePage.css';

type FieldErrors = Partial<Record<keyof MyProfile, string>>;

const EMPTY_PROFILE: MyProfile = {
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  phone: '',
  location: '',
  photoUrl: null,
  languages: [],
  emergencyName: '',
  emergencyPhone: '',
  emailNotifications: true,
  chatAlerts: true,
  flashAlerts: true,
  publicProfile: false,
};

const COMMON_LANGUAGES = [
  'Ugandan Sign Language',
  'English (text)',
  'International Sign',
  'American Sign Language',
  'Kenyan Sign Language',
  'Swahili',
  'French',
  'Arabic',
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { session, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<MyProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState('');
  const [bannerKind, setBannerKind] = useState<'error' | 'success'>('error');
  const [addingLang, setAddingLang] = useState(false);
  const [newLang, setNewLang] = useState('');

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (!p.firstName && !p.lastName && session?.user.name) {
          const [first = '', ...rest] = session.user.name.split(' ');
          p = { ...p, firstName: first, lastName: rest.join(' '), preferredName: first };
        }
        setProfile(p);
      })
      .catch((err) => {
        if (session?.user.name) {
          const [first = '', ...rest] = session.user.name.split(' ');
          setProfile((p) => ({
            ...p,
            firstName: first,
            lastName: rest.join(' '),
            preferredName: first,
          }));
        }
        setBanner(describeError(err));
        setBannerKind('error');
      })
      .finally(() => setLoading(false));
  }, [session?.user.name]);

  useEffect(() => {
    if (!banner || bannerKind !== 'success') return;
    const t = window.setTimeout(() => setBanner(''), 4000);
    return () => window.clearTimeout(t);
  }, [banner, bannerKind]);

  const set = <K extends keyof MyProfile>(k: K, v: MyProfile[K]) => {
    setProfile((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addLanguage = (lang: string) => {
    const trimmed = lang.trim();
    if (!trimmed) return;
    if (profile.languages.includes(trimmed)) {
      setAddingLang(false);
      setNewLang('');
      return;
    }
    set('languages', [...profile.languages, trimmed]);
    setAddingLang(false);
    setNewLang('');
  };

  const removeLanguage = (lang: string) =>
    set(
      'languages',
      profile.languages.filter((l) => l !== lang),
    );

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!profile.firstName.trim()) e.firstName = 'First name is required';
    if (!profile.lastName.trim()) e.lastName = 'Last name is required';
    if (!profile.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      e.email = 'Please enter a valid email';
    if (!profile.phone.trim()) e.phone = 'Phone number is required';
    if (!profile.location.trim()) e.location = 'Location is required';
    if (!profile.emergencyName.trim()) e.emergencyName = 'Emergency contact name is required';
    if (!profile.emergencyPhone.trim()) e.emergencyPhone = 'Emergency contact phone is required';
    return e;
  };

  async function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setBanner('Please fix the errors above.');
      setBannerKind('error');
      return;
    }
    setSaving(true);
    setBanner('');
    try {
      const updated = await updateMyProfile(profile);
      setProfile(updated);
      updateUser({ name: `${updated.firstName} ${updated.lastName}`.trim() });
      setEditing(false);
      setBanner('Profile updated successfully.');
      setBannerKind('success');
    } catch (err) {
      setBanner(describeError(err));
      setBannerKind('error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setBanner('');
    try {
      const url = await uploadProfilePhoto(file);
      if (url) set('photoUrl', url);
      else setBanner('Photo upload succeeded but no URL was returned.');
    } catch (err) {
      setBanner(describeError(err));
      setBannerKind('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePhotoRemove() {
    setUploading(true);
    setBanner('');
    try {
      await removeProfilePhoto();
      set('photoUrl', null);
    } catch (err) {
      setBanner(describeError(err));
      setBannerKind('error');
    } finally {
      setUploading(false);
    }
  }

  const handleCancel = () => {
    setErrors({});
    setEditing(false);
    setAddingLang(false);
    setNewLang('');
    setBanner('');
    fetchMyProfile()
      .then(setProfile)
      .catch(() => {});
  };

  const initial = (profile.firstName[0] ?? '?').toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

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

      {banner && (
        <div
          className={`pr-banner ${bannerKind === 'success' ? 'pr-banner--success' : 'pr-banner--error'}`}
          role={bannerKind === 'error' ? 'alert' : 'status'}
        >
          {bannerKind === 'error' ? <AlertCircle size={15} /> : <RefreshCw size={15} />} {banner}
        </div>
      )}

      <div className="pr-columns">
        {/* LEFT */}
        <div className="pr-left">
          <div className="pr-card">
            <div className="pr-photo">
              {profile.photoUrl ? (
                <img className="pr-avatar-img" src={profile.photoUrl} alt={fullName} />
              ) : (
                <span className="pr-avatar">{initial}</span>
              )}
              <div className="pr-photo-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void handlePhotoChange(e)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera size={14} /> {uploading ? 'Uploading…' : 'Change photo'}
                </button>
                {profile.photoUrl && (
                  <button
                    type="button"
                    onClick={() => void handlePhotoRemove()}
                    disabled={uploading}
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pr-card">
            <h2>Profile details</h2>
            <div className="pr-grid">
              <div className="pr-field">
                <label>Full name</label>
                <input
                  className={errors.firstName || errors.lastName ? 'pr-invalid' : ''}
                  value={fullName}
                  disabled={loading || !editing}
                  onChange={(e) => {
                    const [f, ...rest] = e.target.value.split(' ');
                    set('firstName', f ?? '');
                    set('lastName', rest.join(' '));
                  }}
                />
                {(errors.firstName || errors.lastName) && (
                  <span className="pr-msg">{errors.firstName || errors.lastName}</span>
                )}
              </div>

              <div className="pr-field">
                <label>Preferred name</label>
                <input
                  value={profile.preferredName}
                  disabled={loading || !editing}
                  onChange={(e) => set('preferredName', e.target.value)}
                />
              </div>

              <div className="pr-field">
                <label>Email</label>
                <div className={`pr-input ${errors.email ? 'pr-invalid' : ''}`}>
                  <Mail size={14} />
                  <input
                    type="email"
                    value={profile.email}
                    disabled={loading || !editing}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
                {errors.email && <span className="pr-msg">{errors.email}</span>}
              </div>

              <div className="pr-field">
                <label>Phone number</label>
                <div className={`pr-input ${errors.phone ? 'pr-invalid' : ''}`}>
                  <Phone size={14} />
                  <input
                    value={profile.phone}
                    disabled={loading || !editing}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <span className="pr-msg">{errors.phone}</span>}
              </div>

              <div className="pr-field pr-field--full">
                <label>Location</label>
                <div className={`pr-input ${errors.location ? 'pr-invalid' : ''}`}>
                  <MapPin size={14} />
                  <input
                    value={profile.location}
                    disabled={loading || !editing}
                    onChange={(e) => set('location', e.target.value)}
                  />
                </div>
                {errors.location && <span className="pr-msg">{errors.location}</span>}
              </div>
            </div>
          </div>

          <div className="pr-card">
            <h2>Sign language preference</h2>
            <div className="pr-chips">
              {profile.languages.length === 0 && !editing && (
                <span className="pr-hint">No languages added yet.</span>
              )}
              {profile.languages.map((l) => (
                <span key={l} className="pr-chip">
                  {l}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(l)}
                      aria-label={`Remove ${l}`}
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}

              {editing && !addingLang && (
                <button
                  type="button"
                  className="pr-chip pr-chip--add"
                  onClick={() => setAddingLang(true)}
                >
                  <Plus size={12} /> Add language
                </button>
              )}

              {editing && addingLang && (
                <div className="pr-chip-add-row">
                  <select
                    className="pr-lang-select"
                    value={newLang}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewLang(v);
                      if (v === '__custom__') return;
                      addLanguage(v);
                    }}
                  >
                    <option value="">Choose a language…</option>
                    {COMMON_LANGUAGES.filter((l) => !profile.languages.includes(l)).map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    <option value="__custom__">Other (type your own)</option>
                  </select>
                  {newLang === '__custom__' && (
                    <input
                      className="pr-lang-input"
                      autoFocus
                      placeholder="Type a language"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLanguage((e.target as HTMLInputElement).value);
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) addLanguage(e.target.value);
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className="pr-chip-cancel"
                    onClick={() => {
                      setAddingLang(false);
                      setNewLang('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
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
                  className={errors.emergencyName ? 'pr-invalid' : ''}
                  value={profile.emergencyName}
                  disabled={loading || !editing}
                  onChange={(e) => set('emergencyName', e.target.value)}
                />
                {errors.emergencyName && <span className="pr-msg">{errors.emergencyName}</span>}
              </div>
              <div className="pr-field">
                <label>Phone</label>
                <input
                  className={errors.emergencyPhone ? 'pr-invalid' : ''}
                  value={profile.emergencyPhone}
                  disabled={loading || !editing}
                  onChange={(e) => set('emergencyPhone', e.target.value)}
                />
                {errors.emergencyPhone && <span className="pr-msg">{errors.emergencyPhone}</span>}
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
              {profile.languages.length === 0 ? (
                <li>No preferences set yet.</li>
              ) : (
                profile.languages.map((l, i) => (
                  <li key={l}>
                    ✓ {l} {i === 0 && <span className="pr-tag">Main</span>}
                  </li>
                ))
              )}
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
                    className={`pr-switch ${profile[k] ? 'pr-switch--on' : ''}`}
                    disabled={loading || !editing}
                    onClick={() => set(k, !profile[k])}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions moved here — inside the right column, below Preferences */}
          <div className="pr-actions pr-actions--inline">
            {editing ? (
              <>
                <button className="pr-btn pr-btn--ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button
                  className="pr-btn pr-btn--primary"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button
                className="pr-btn pr-btn--primary"
                onClick={() => setEditing(true)}
                disabled={loading}
              >
                <Pencil size={15} /> Edit profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
