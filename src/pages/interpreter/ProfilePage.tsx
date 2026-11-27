import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  Clock,
  Heart,
  Languages,
  Pencil,
  Plus,
  Save,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SignOutButton } from '../../components/SignOutButton';
import { describeError } from '../../services/api';
import { getMyPhoto, removeMyPhoto, uploadMyPhoto } from '../../services/photos';
import {
  getInterpreterProfile,
  getMyInterpreterProfileStats,
  updateInterpreterProfile,
} from '../../services/interpreterProfile';
import { ProfilePhotoCropper } from '../dashboards/ProfilePhotoCropper';
// One look for every profile: this is the Deaf user's profile stylesheet.
import '../deaf/ProfilePage.css';

interface InterpreterProfile {
  fullName: string;
  yearsExperience: number | null;
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
    yearsExperience: null,
    available: true,
    languages: ['Ugandan Sign Language', 'English', 'International Sign'],
    specialisations: ['Healthcare', 'Legal', 'Education'],
    availabilityToday: 'Today until 6:00 PM',
    responseTime: 'under 2 min',
    emergencyName: 'Sarah Okafor',
    emergencyPhone: '+256 771 987 654',
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<{
    averageRating: number | null;
    completedSessions: number;
  } | null>(null);
  const [statsError, setStatsError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedExperience, setSavedExperience] = useState<number | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    getInterpreterProfile().then(
      (profile) => {
        if (!cancelled) {
          setSavedExperience(profile.yearsExperience);
          setForm((current) => ({ ...current, yearsExperience: profile.yearsExperience }));
        }
      },
      (err) => {
        if (!cancelled) setProfileError(describeError(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyInterpreterProfileStats().then(
      (stats) => {
        if (!cancelled) {
          setProfileStats({
            averageRating: stats.average_rating,
            completedSessions: stats.completed_sessions,
          });
        }
      },
      (err) => {
        if (!cancelled) setStatsError(describeError(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    });
    reader.readAsDataURL(file);

    if (fileInput.current) fileInput.current.value = '';
  }

  async function handleCropComplete(croppedBlob: Blob) {
    setShowCropper(false);
    setPhotoBusy(true);
    setPhotoError('');

    try {
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const url = await uploadMyPhoto(file);

      if (url) setPhotoUrl(url);
    } catch (err) {
      setPhotoError(describeError(err));
    } finally {
      setPhotoBusy(false);
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
    if (
      form.yearsExperience === null ||
      !Number.isInteger(form.yearsExperience) ||
      form.yearsExperience < 0
    )
      e.yearsExperience = 'Enter a whole number of years (0 or more)';
    if (form.languages.length === 0) e.languages = 'At least one language is required';
    if (form.specialisations.length === 0)
      e.specialisations = 'At least one specialisation is required';
    if (!form.emergencyName.trim()) e.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Emergency contact phone is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length !== 0 || form.yearsExperience === null) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const saved = await updateInterpreterProfile({ yearsExperience: form.yearsExperience });
      setSavedExperience(saved.yearsExperience);
      setForm((current) => ({ ...current, yearsExperience: saved.yearsExperience }));
      setEditing(false);
    } catch (err) {
      setProfileError(describeError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    setForm((current) => ({ ...current, yearsExperience: savedExperience }));
    setEditing(false);
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const banner = profileError || photoError || (hasErrors ? 'Please fix the errors below.' : '');
  const initial = form.fullName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className={`pr-page${editing ? ' pr-page--editing' : ''}`}>
      <div className="pr-header">
        <div>
          <div className="pr-title-row">
            <h1>{editing ? 'Edit interpreter profile' : 'Interpreter profile'}</h1>
            <span className={`pr-mode${editing ? ' pr-mode--edit' : ''}`}>
              {editing ? 'Editing' : 'Viewing'}
            </span>
          </div>
          <p>Manage your skills, availability, and preferences.</p>
        </div>
        <button
          type="button"
          className="pr-back"
          onClick={() => navigate('/dashboard/interpreter')}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {banner && (
        <div className="pr-banner pr-banner--error" role="alert">
          <AlertCircle size={15} /> {banner}
        </div>
      )}

      <div className="pr-columns">
        {/* LEFT */}
        <div className="pr-left">
          <div className="pr-card">
            <div className="pr-photo">
              {photoUrl ? (
                <img className="pr-avatar-img" src={photoUrl} alt={form.fullName} />
              ) : (
                <span className="pr-avatar">{initial}</span>
              )}
              <div className="pr-photo-actions">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => fileInput.current?.click()}
                >
                  <Camera size={14} />{' '}
                  {photoBusy ? 'Working…' : photoUrl ? 'Change photo' : 'Add photo'}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    disabled={photoBusy}
                    onClick={() => void handlePhotoRemove()}
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="pr-stats">
              <span className="pr-stat">
                <Star size={14} className="pr-star" />{' '}
                {profileStats?.averageRating == null ? '—' : profileStats.averageRating.toFixed(2)}
              </span>
              <span className="pr-stat">
                {profileStats ? profileStats.completedSessions : '—'} completed sessions
              </span>
              {form.available && <span className="pr-badge pr-badge--ok">Available now</span>}
            </div>
            {statsError && (
              <span className="pr-msg" role="status">
                {statsError}
              </span>
            )}
          </div>

          <div className="pr-card">
            <h2>
              <BadgeCheck size={15} /> Profile details
            </h2>
            <div className="pr-grid">
              <div className="pr-field">
                <label htmlFor="interpreter-name">Full name</label>
                <input
                  id="interpreter-name"
                  className={errors.fullName ? 'pr-invalid' : ''}
                  value={form.fullName}
                  disabled={!editing}
                  onChange={(e) => set('fullName', e.target.value)}
                />
                {errors.fullName && <span className="pr-msg">{errors.fullName}</span>}
              </div>

              <div className="pr-field">
                <label htmlFor="interpreter-experience">Years of interpreting experience</label>
                <input
                  id="interpreter-experience"
                  className={errors.yearsExperience ? 'pr-invalid' : ''}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Not provided"
                  value={form.yearsExperience ?? ''}
                  disabled={!editing}
                  onChange={(event) =>
                    set(
                      'yearsExperience',
                      event.target.value === '' ? null : Number(event.target.value),
                    )
                  }
                />
                {errors.yearsExperience && <span className="pr-msg">{errors.yearsExperience}</span>}
              </div>
            </div>
          </div>

          <div className="pr-card">
            <h2>
              <Languages size={15} /> Languages
            </h2>
            <div className="pr-chips">
              {form.languages.map((l) => (
                <span key={l} className="pr-chip">
                  {l}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeItem('languages', l)}
                      aria-label={`Remove ${l}`}
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="pr-add-row">
                <input
                  placeholder="Add language"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                />
                <button
                  type="button"
                  className="pr-icon-btn"
                  onClick={() => addItem('languages')}
                  aria-label="Add language"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            {errors.languages && <span className="pr-msg">{errors.languages}</span>}
          </div>

          <div className="pr-card">
            <h2>Specialisations</h2>
            <div className="pr-chips">
              {form.specialisations.map((s) => (
                <span key={s} className="pr-chip">
                  {s}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeItem('specialisations', s)}
                      aria-label={`Remove ${s}`}
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="pr-add-row">
                <input
                  placeholder="Add specialisation"
                  value={newSpecialisation}
                  onChange={(e) => setNewSpecialisation(e.target.value)}
                />
                <button
                  type="button"
                  className="pr-icon-btn"
                  onClick={() => addItem('specialisations')}
                  aria-label="Add specialisation"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            {errors.specialisations && <span className="pr-msg">{errors.specialisations}</span>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="pr-right">
          <div className="pr-card">
            <h2>
              <Clock size={15} /> Availability
            </h2>
            <ul className="pr-list">
              <li>✓ {form.availabilityToday}</li>
              <li>✓ Response time: {form.responseTime}</li>
            </ul>
          </div>

          <div className="pr-card">
            <h2>
              <Heart size={15} /> Emergency contact
            </h2>
            <div className="pr-grid">
              <div className="pr-field">
                <label htmlFor="interpreter-emergency-name">Name</label>
                <input
                  id="interpreter-emergency-name"
                  className={errors.emergencyName ? 'pr-invalid' : ''}
                  value={form.emergencyName}
                  disabled={!editing}
                  onChange={(e) => set('emergencyName', e.target.value)}
                />
                {errors.emergencyName && <span className="pr-msg">{errors.emergencyName}</span>}
              </div>
              <div className="pr-field">
                <label htmlFor="interpreter-emergency-phone">Phone</label>
                <input
                  id="interpreter-emergency-phone"
                  className={errors.emergencyPhone ? 'pr-invalid' : ''}
                  value={form.emergencyPhone}
                  disabled={!editing}
                  onChange={(e) => set('emergencyPhone', e.target.value)}
                />
                {errors.emergencyPhone && <span className="pr-msg">{errors.emergencyPhone}</span>}
              </div>
            </div>
          </div>

          <div className="pr-actions pr-actions--inline">
            {editing ? (
              <>
                <button
                  type="button"
                  className="pr-btn pr-btn--ghost"
                  disabled={savingProfile}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pr-btn pr-btn--primary"
                  disabled={savingProfile}
                  onClick={() => void handleSave()}
                >
                  <Save size={15} /> {savingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pr-btn pr-btn--primary"
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} /> Edit profile
              </button>
            )}
          </div>
          <SignOutButton />
        </div>
      </div>

      {showCropper && selectedImage && (
        <ProfilePhotoCropper
          image={selectedImage}
          onCropComplete={(blob) => void handleCropComplete(blob)}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}
