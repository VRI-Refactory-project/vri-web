import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { FieldError } from '../../components/FieldError';
import { PhoneField } from '../../components/PhoneField';
import { useAuth } from '../../hooks/useAuth';
import { useFieldErrors } from '../../lib/useFieldErrors';
import { collectErrors, validateName, validatePhone } from '../../lib/validation';
import { ApiError, describeError } from '../../services/api';
import { getMyAccount, type MyAccount } from '../../services/auth';
import {
  getInstitutionOverview,
  type InstitutionOverview,
} from '../../services/institutionDashboard';
import { updateMyProfile } from '../../services/staff';
// One look for every profile: this is the Deaf user's profile stylesheet.
import '../../pages/deaf/ProfilePage.css';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

type Field = 'name' | 'phone';

const ORDER: readonly Field[] = ['name', 'phone'];

const SERVER_FIELDS: Record<Field, string> = {
  name: 'full_name',
  phone: 'phone_number',
};

const fieldId = (name: Field) => `staff-profile-${name}`;

interface MyProfilePageProps {
  isInstitutionAdmin?: boolean;
}

/**
 * The signed-in person's own profile. Shared by institution administrators and institution staff.
 * Looks like the Deaf user's profile. It opens in "viewing" mode (every field greyed out) and
 * switches to "editing" mode (name and phone turn white) when the person presses Edit profile.
 */
export function MyProfilePage({ isInstitutionAdmin = false }: MyProfilePageProps) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [account, setAccount] = useState<MyAccount | null>(null);
  const [institution, setInstitution] = useState<InstitutionOverview | null>(null);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // What is typed in the two fields you can change.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});

  useEffect(() => {
    let cancelled = false;

    getMyAccount().then(
      (value) => {
        if (cancelled) return;
        setAccount(value);
        setName(value.name);
        setPhone(value.phone);
      },
      (err) => !cancelled && setLoadError(describeError(err)),
    );

    getInstitutionOverview().then(
      (value) => !cancelled && setInstitution(value),
      () => undefined,
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const errors = collectErrors<Field>({
    name: validateName(name) ?? serverErrors.name,
    phone: validatePhone(phone) ?? serverErrors.phone,
  });

  const { shown, touch, fieldProps, check } = useFieldErrors(errors, ORDER, fieldId);

  const change = (field: Field) => (value: string) => {
    (field === 'name' ? setName : setPhone)(value);
    setServerErrors((current) => ({ ...current, [field]: undefined }));
  };

  const startEditing = () => {
    setSaved(false);
    setSaveError('');
    setEditing(true);
  };

  // Cancel puts back what was saved and returns to viewing.
  const cancel = () => {
    if (account) {
      setName(account.name);
      setPhone(account.phone);
    }
    setServerErrors({});
    setSaveError('');
    setEditing(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError('');

    if (!check()) return;

    setSaving(true);

    try {
      const updated = await updateMyProfile({ fullName: name, phone });
      setAccount((current) => current && { ...current, name: updated.name, phone: updated.phone });
      setName(updated.name);
      setPhone(updated.phone);
      updateUser({ name: updated.name });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      const byField =
        err instanceof ApiError
          ? collectErrors<Field>({
              name: err.fieldError(SERVER_FIELDS.name),
              phone: err.fieldError(SERVER_FIELDS.phone),
            })
          : {};

      if (Object.keys(byField).length > 0) setServerErrors(byField);
      else setSaveError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = institution ? (institution.role === 'ADMIN' ? 'Administrator' : 'Staff') : '';
  const banner = loadError || saveError;

  return (
    <div className={`pr-page${editing ? ' pr-page--editing' : ''}`}>
      <div className="pr-header">
        <div>
          <div className="pr-title-row">
            <h1>{editing ? 'Edit Profile' : 'My Profile'}</h1>
            <span className={`pr-mode${editing ? ' pr-mode--edit' : ''}`}>
              {editing ? 'Editing' : 'Viewing'}
            </span>
          </div>
          <p>
            {editing
              ? 'Change your name or phone number, then save.'
              : 'View your personal details on SignConnect.'}
          </p>
        </div>
        <button
          type="button"
          className="pr-back"
          onClick={() =>
            navigate(isInstitutionAdmin ? '/dashboard/institution' : '/dashboard/staff')
          }
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {banner && (
        <div className="pr-banner pr-banner--error" role="alert">
          <AlertCircle size={15} /> {banner}
        </div>
      )}

      {saved && (
        <div className="pr-banner pr-banner--success" role="status">
          <Check size={15} /> Your details have been saved.
        </div>
      )}

      {!loadError && !account && <p className="pr-hint">Loading your profile…</p>}

      {account && (
        <form
          className="pr-columns"
          onSubmit={(e) => void submit(e)}
          noValidate
          aria-label="Your details"
        >
          {/* LEFT: who you are, then the details */}
          <div className="pr-left">
            <div className="pr-card">
              <div className="pr-identity">
                <span className="pr-avatar" aria-hidden="true">
                  {initials(account.name)}
                </span>
                <div className="pr-identity-text">
                  <strong>{account.name}</strong>
                  <span>{institution ? institution.name : 'Institution account'}</span>
                  <div className="pr-identity-badges">
                    {roleLabel && <span className="pr-badge">{roleLabel}</span>}
                    {account.email && (
                      <span
                        className={`pr-badge ${account.emailVerified ? 'pr-badge--ok' : 'pr-badge--warn'}`}
                      >
                        {account.emailVerified ? 'Verified' : 'Not verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pr-card">
              <h2>Profile details</h2>
              <div className="pr-grid">
                <div className="pr-field">
                  <label htmlFor={fieldId('name')}>Full name</label>
                  <input
                    {...fieldProps('name')}
                    className={shown('name') ? 'pr-invalid' : ''}
                    type="text"
                    autoComplete="name"
                    value={name}
                    disabled={!editing}
                    onChange={(e) => change('name')(e.target.value)}
                  />
                  <FieldError id={fieldId('name')} message={shown('name')} />
                </div>

                <div className="pr-field">
                  <label htmlFor={fieldId('phone')}>Phone number</label>
                  {editing ? (
                    <PhoneField
                      id={fieldId('phone')}
                      value={phone}
                      onChange={change('phone')}
                      onBlur={touch('phone')}
                      invalid={Boolean(shown('phone'))}
                      errorId={shown('phone') ? `${fieldId('phone')}-error` : undefined}
                    />
                  ) : (
                    <div className="pr-input">
                      <Phone size={14} />
                      <input id={fieldId('phone')} value={account.phone} disabled readOnly />
                    </div>
                  )}
                  <FieldError id={fieldId('phone')} message={shown('phone')} />
                </div>

                <div className="pr-field pr-field--full">
                  <label htmlFor="staff-profile-email">Email</label>
                  <div className="pr-input">
                    <Mail size={14} />
                    <input
                      id="staff-profile-email"
                      value={account.email ?? 'None on this account'}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                {institution && (
                  <>
                    <div className="pr-field">
                      <label htmlFor="staff-profile-institution">Institution</label>
                      <div className="pr-input">
                        <Building2 size={14} />
                        <input
                          id="staff-profile-institution"
                          value={institution.name}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="pr-field">
                      <label htmlFor="staff-profile-role">Role</label>
                      <div className="pr-input">
                        <ShieldCheck size={14} />
                        <input id="staff-profile-role" value={roleLabel} disabled readOnly />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: what you can change, then the buttons */}
          <div className="pr-right">
            <div className="pr-card">
              <h2>
                <UserRound size={15} /> What you can change
              </h2>
              <p className="pr-hint">
                {isInstitutionAdmin ? (
                  'Your email and administrator role cannot be changed from this page.'
                ) : (
                  <>
                    Your email, department and role are managed by your institution’s administrator.
                    You can change your password in{' '}
                    <Link to="/dashboard/staff/settings">Settings</Link>.
                  </>
                )}
              </p>
            </div>

            <div className="pr-actions pr-actions--inline">
              {editing ? (
                <>
                  <button
                    type="button"
                    className="pr-btn pr-btn--ghost"
                    onClick={cancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pr-btn pr-btn--primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </>
              ) : (
                <button type="button" className="pr-btn pr-btn--primary" onClick={startEditing}>
                  <Pencil size={15} /> Edit profile
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
