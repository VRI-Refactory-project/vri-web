import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '../../components/Authlayout';
import { useAuth } from '../../hooks/useAuth';
import { useValidation } from '../../hooks/useValidation';
import { describeError } from '../../services/api';
import { registerInstitution, type OrganisationType } from '../../services/registration';
import backgroundImage from '../../assets/background_image.png';
import './AuthPages.css';
import './PhotoBackground.css';

const TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital or clinic' },
  { value: 'COURT', label: 'Court' },
  { value: 'GOVERNMENT', label: 'Government office' },
  { value: 'OTHER', label: 'Other' },
];

export const SignUpInstitution = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    validateEmail,
    validatePhone,
    validateName,
    validatePassword,
    validateConfirmPassword,
  } = useValidation();

  const [form, setForm] = useState({
    organisationName: '',
    organisationType: 'HOSPITAL' as OrganisationType,
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateField = (field: string, value: string) => {
    let err: string | null = null;
    switch (field) {
      case 'organisationName':
        if (!value.trim()) err = 'Institution name is required';
        break;
      case 'name':
        err = validateName(value);
        break;
      case 'phone':
        err = validatePhone(value);
        break;
      case 'email':
        err = validateEmail(value);
        break;
      case 'password':
        err = validatePassword(value);
        break;
      case 'confirmPassword':
        err = validateConfirmPassword(form.password, value);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, form[field as keyof typeof form]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const allTouched = Object.keys(form).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {},
    );
    setTouched(allTouched);

    let hasError = false;
    Object.keys(form).forEach((key) => {
      validateField(key, form[key as keyof typeof form]);
      if (!form[key as keyof typeof form] || errors[key]) hasError = true;
    });

    if (hasError) {
      setError('Please fix the errors above.');
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...dataToSend } = form;
      login(await registerInstitution(dataToSend));
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
              className={`form-input ${
                touched.organisationName && errors.organisationName ? 'input-error' : ''
              } ${
                touched.organisationName && !errors.organisationName ? 'input-success' : ''
              }`}
              placeholder="Mulago Medical Center"
              value={form.organisationName}
              onChange={set('organisationName')}
              onBlur={() => handleBlur('organisationName')}
            />
            {touched.organisationName && errors.organisationName && (
              <span className="input-error-text">{errors.organisationName}</span>
            )}
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
              className={`form-input ${
                touched.name && errors.name ? 'input-error' : ''
              } ${touched.name && !errors.name ? 'input-success' : ''}`}
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              onBlur={() => handleBlur('name')}
            />
            {touched.name && errors.name && (
              <span className="input-error-text">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="inst-phone">Phone number</label>
            <input
              id="inst-phone"
              type="tel"
              className={`form-input ${
                touched.phone && errors.phone ? 'input-error' : ''
              } ${touched.phone && !errors.phone ? 'input-success' : ''}`}
              autoComplete="tel"
              placeholder="0772 123 456 or +256..."
              value={form.phone}
              onChange={set('phone')}
              onBlur={() => handleBlur('phone')}
            />
            {touched.phone && errors.phone && (
              <span className="input-error-text">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="inst-email">Work email</label>
            <input
              id="inst-email"
              type="email"
              className={`form-input ${
                touched.email && errors.email ? 'input-error' : ''
              } ${touched.email && !errors.email ? 'input-success' : ''}`}
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set('email')}
              onBlur={() => handleBlur('email')}
            />
            {touched.email && errors.email && (
              <span className="input-error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="inst-password">Password</label>
            <input
              id="inst-password"
              type="password"
              className={`form-input ${
                touched.password && errors.password ? 'input-error' : ''
              } ${touched.password && !errors.password ? 'input-success' : ''}`}
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={set('password')}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && errors.password && (
              <span className="input-error-text">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="inst-confirm-password">Confirm Password</label>
            <input
              id="inst-confirm-password"
              type="password"
              className={`form-input ${
                touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''
              } ${
                touched.confirmPassword && !errors.confirmPassword ? 'input-success' : ''
              }`}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="input-error-text">{errors.confirmPassword}</span>
            )}
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