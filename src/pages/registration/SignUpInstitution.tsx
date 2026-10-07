import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { useAuth } from '../../hooks/useAuth';
import { describeError } from '../../services/api';
import { registerInstitution, type OrganisationType } from '../../services/registration';
import backgroundImage from '../../assets/background_image.png';
import './AuthPages.css';
import './PhotoBackground.css';

// The person who registers an institution becomes its admin (backend creates both).
const TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital or clinic' },
  { value: 'COURT', label: 'Court' },
  { value: 'GOVERNMENT', label: 'Government office' },
  { value: 'OTHER', label: 'Other' },
];

export const SignUpInstitution = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    organisationName: '',
    organisationType: 'HOSPITAL' as OrganisationType,
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (
      !form.organisationName.trim() ||
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError('Fill in every field.');
      return;
    }
    setSubmitting(true);
    try {
      login(await registerInstitution(form));
      navigate('/register/pending', { replace: true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="photo-bg" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <AuthLayout
        title="Register your institution"
        subtitle="Set up secure interpreting access for your organisation."
        onBack={() => navigate('/get-started')}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="inst-org">Institution name</label>
            <input
              id="inst-org"
              type="text"
              className="form-input"
              placeholder="Mulago Medical Center"
              value={form.organisationName}
              onChange={set('organisationName')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inst-type">Institution type</label>
            <select
              id="inst-type"
              className="form-input"
              value={form.organisationType}
              onChange={set('organisationType')}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="inst-name">Your full name</label>
            <input
              id="inst-name"
              type="text"
              className="form-input"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inst-phone">Phone number</label>
            <input
              id="inst-phone"
              type="tel"
              className="form-input"
              autoComplete="tel"
              placeholder="0772 123 456"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inst-email">Work email</label>
            <input
              id="inst-email"
              type="email"
              className="form-input"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inst-password">Password</label>
            <input
              id="inst-password"
              type="password"
              className="form-input"
              autoComplete="new-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={set('password')}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '16px' }}
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : 'Submit registration'} <ChevronRight size={18} />
          </button>
        </form>

        <div className="step-indicator">
          <div className="step active"></div>
          <div className="step active"></div>
          <div className="step"></div>
          <p className="step-text">Step 2 of 3</p>
        </div>
      </AuthLayout>
    </div>
  );
};
