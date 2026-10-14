// src/pages/interpreter/ProfilePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Star, Pencil, Save, X, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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

export function ProfilePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const fullName = session?.user.name ?? 'Amina Okafor';

  const [editing, setEditing] = useState(false);
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

  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialisation, setNewSpecialisation] = useState('');

  const set = <K extends keyof InterpreterProfile>(k: K, v: InterpreterProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const removeItem = (key: 'languages' | 'specialisations', value: string) =>
    set(
      key,
      form[key].filter((v) => v !== value),
    );

  const addItem = (key: 'languages' | 'specialisations') => {
    const v = key === 'languages' ? newLanguage : newSpecialisation;
    if (!v.trim()) return;
    set(key, [...form[key], v.trim()]);
    if (key === 'languages') setNewLanguage('');
    else setNewSpecialisation('');
  };

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

      {/* Hero card */}
      <div className="ip-card ip-hero">
        <span className="ip-avatar">{fullName.trim().charAt(0).toUpperCase() || 'A'}</span>
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

      {/* Three panels */}
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
        </div>
      </div>

      {/* Actions */}
      <div className="ip-actions">
        {editing ? (
          <>
            <button className="ip-btn ip-btn--ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="ip-btn ip-btn--primary" onClick={() => setEditing(false)}>
              <Save size={15} /> Save changes
            </button>
          </>
        ) : (
          <button className="ip-btn ip-btn--primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit profile
          </button>
        )}
      </div>
    </div>
  );
}
