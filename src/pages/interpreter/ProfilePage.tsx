// src/pages/interpreter/ProfilePage.tsx
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Star, Pencil, Save, X, Plus, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SignOutButton } from '../../components/SignOutButton';
import { describeError } from '../../services/api';
import { getMyPhoto, removeMyPhoto, uploadMyPhoto } from '../../services/photos';
import './ProfilePage.css';

interface InterpreterProfile {
  fullName: string;
  headline: string;
  rating: number;
  sessions: number;
  available: boolean;
  languages: string[];
  specialisations: string[];
  availabilityToday: string;
  responseTime: string;
  emergencyName: string;
  emergencyPhone: string;
}

type FieldErrors = Partial<Record<keyof InterpreterProfile, string>>;

export function ProfilePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const fullName = session?.user.name ?? 'Amina Okafor';

  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<InterpreterProfile>({
    fullName,
    headline: 'Certified ASL Interpreter · 8 years experience',
    rating: 4.9,
    sessions: 128,
    available: true,
    languages: ['Ugandan Sign Language', 'English', 'International Sign'],
    specialisations: ['Healthcare', 'Legal', 'Education'],
    availabilityToday: 'Today until 6:00 PM',
    responseTime: 'under 2 min',
    emergencyName: 'Sarah Okafor',
    emergencyPhone: '+256 771 987 654',
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // A failed lookup just leaves the initial showing.
  useEffect(() => {
    let cancelled = false;
    getMyPhoto().then(
      (url) => {
        if (!cancelled) setPhotoUrl(url);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      setPhotoUrl(await uploadMyPhoto(file));
    } catch (err) {
      setPhotoError(describeError(err));
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function handlePhotoRemove() {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      await removeMyPhoto();
      setPhotoUrl(null);
    } catch (err) {
      setPhotoError(describeError(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialisation, setNewSpecialisation] = useState('');

  const set = <K extends keyof InterpreterProfile>(k: K, v: InterpreterProfile[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const removeItem = (key: 'languages' | 'specialisations', value: string) => {
    set(
      key,
      form[key].filter((v) => v !== value),
    );
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addItem = (key: 'languages' | 'specialisations') => {
    const v = key === 'languages' ? newLanguage : newSpecialisation;
    if (!v.trim()) return;
    set(key, [...form[key], v.trim()]);
    if (key === 'languages') setNewLanguage('');
    else setNewSpecialisation('');
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.headline.trim()) e.headline = 'Headline is required';
    if (form.languages.length === 0) e.languages = 'At least one language is required';
    if (form.specialisations.length === 0)
      e.specialisations = 'At least one specialisation is required';
    if (!form.emergencyName.trim()) e.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Emergency contact phone is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) setEditing(false);
  };

  const handleCancel = () => {
    setErrors({});
    setEditing(false);
  };

  const topError =
    errors.fullName ||
    errors.headline ||
    errors.languages ||
    errors.specialisations ||
    errors.emergencyName ||
    errors.emergencyPhone;

  return (
    <div className="ip-page">
      <div className="ip-header">
        <div>
          <h1>{editing ? 'Edit interpreter profile' : 'Interpreter profile'}</h1>
          <p>Manage your skills, availability, and preferences.</p>
        </div>
        <button className="ip-back" onClick={() => navigate('/dashboard/interpreter')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {topError && <div className="ip-error">{topError}</div>}
      {photoError && <div className="ip-error">{photoError}</div>}

      <div className="ip-card ip-hero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              style={{ width: 84, height: 84, borderRadius: 15, objectFit: 'cover' }}
            />
          ) : (
            <span className="ip-avatar">{fullName.trim().charAt(0).toUpperCase() || 'A'}</span>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void handlePhotoChange(e)}
          />
          <button
            type="button"
            className="ip-btn ip-btn--ghost"
            style={{ padding: '6px 12px', fontSize: 12 }}
            disabled={photoBusy}
            onClick={() => fileInput.current?.click()}
          >
            <Camera size={13} /> {photoBusy ? 'Working…' : photoUrl ? 'Change photo' : 'Add photo'}
          </button>
          {photoUrl && (
            <button
              type="button"
              className="ip-btn ip-btn--ghost"
              style={{ padding: '6px 12px', fontSize: 12 }}
              disabled={photoBusy}
              onClick={() => void handlePhotoRemove()}
            >
              <X size={13} /> Remove
            </button>
          )}
        </div>
        <div className="ip-hero-info">
          <div className="ip-name">
            {editing ? (
              <input
                className="ip-name-input"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            ) : (
              <span>{form.fullName}</span>
            )}
            <BadgeCheck size={18} className="ip-verified" />
          </div>
          <p className="ip-headline">{form.headline}</p>
          <div className="ip-stats">
            <span>
              <Star size={14} className="ip-star" /> {form.rating.toFixed(2)}
            </span>
            <span>{form.sessions} sessions</span>
          </div>
          {form.available && <span className="ip-pill">Available now</span>}
        </div>
      </div>

      {(errors.fullName || errors.headline) && (
        <div className="ip-card">
          {errors.fullName && <div className="ip-field-error">{errors.fullName}</div>}
          {errors.headline && <div className="ip-field-error">{errors.headline}</div>}
        </div>
      )}

      <div className="ip-grid">
        <div className="ip-card">
          <h2>Languages</h2>
          <ul className="ip-list">
            {form.languages.map((l) => (
              <li key={l}>
                <span>✓ {l}</span>
                {editing && (
                  <button onClick={() => removeItem('languages', l)} aria-label={`Remove ${l}`}>
                    <X size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="ip-add">
              <input
                placeholder="Add language"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
              />
              <button onClick={() => addItem('languages')} aria-label="Add language">
                <Plus size={14} />
              </button>
            </div>
          )}
          {errors.languages && <div className="ip-field-error">{errors.languages}</div>}
        </div>

        <div className="ip-card">
          <h2>Specialisations</h2>
          <ul className="ip-list">
            {form.specialisations.map((s) => (
              <li key={s}>
                <span>✓ {s}</span>
                {editing && (
                  <button
                    onClick={() => removeItem('specialisations', s)}
                    aria-label={`Remove ${s}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="ip-add">
              <input
                placeholder="Add specialisation"
                value={newSpecialisation}
                onChange={(e) => setNewSpecialisation(e.target.value)}
              />
              <button onClick={() => addItem('specialisations')} aria-label="Add specialisation">
                <Plus size={14} />
              </button>
            </div>
          )}
          {errors.specialisations && <div className="ip-field-error">{errors.specialisations}</div>}
        </div>

        <div className="ip-card">
          <h2>Availability</h2>
          <ul className="ip-list">
            <li>
              <span>✓ {form.availabilityToday}</span>
            </li>
            <li>
              <span>✓ Response time: {form.responseTime}</span>
            </li>
          </ul>
        </div>

        <div className="ip-card">
          <h2>Emergency contact</h2>
          <ul className="ip-list">
            <li>
              <span>
                Name:
                {editing ? (
                  <input
                    className="ip-inline-input"
                    value={form.emergencyName}
                    onChange={(e) => set('emergencyName', e.target.value)}
                  />
                ) : (
                  <> {form.emergencyName}</>
                )}
              </span>
            </li>
            <li>
              <span>
                Phone:
                {editing ? (
                  <input
                    className="ip-inline-input"
                    value={form.emergencyPhone}
                    onChange={(e) => set('emergencyPhone', e.target.value)}
                  />
                ) : (
                  <> {form.emergencyPhone}</>
                )}
              </span>
            </li>
          </ul>
          {errors.emergencyName && <div className="ip-field-error">{errors.emergencyName}</div>}
          {errors.emergencyPhone && <div className="ip-field-error">{errors.emergencyPhone}</div>}
        </div>
      </div>

      <div className="ip-actions">
        {editing ? (
          <>
            <button className="ip-btn ip-btn--ghost" onClick={handleCancel}>
              Cancel
            </button>
            <button className="ip-btn ip-btn--primary" onClick={handleSave}>
              <Save size={15} /> Save changes
            </button>
          </>
        ) : (
          <button className="ip-btn ip-btn--primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit profile
          </button>
        )}
      </div>
      <SignOutButton />
    </div>
  );
}
