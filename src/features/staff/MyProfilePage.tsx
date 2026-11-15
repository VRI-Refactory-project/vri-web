import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
import '../../pages/deaf/SessionsPages.css';
import './StaffPages.css';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** The signed-in staff member's own details, and the institution they belong to. */
export function MyProfilePage() {
  const { updateUser } = useAuth();
  const [account, setAccount] = useState<MyAccount | null>(null);
  const [institution, setInstitution] = useState<InstitutionOverview | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyAccount().then(
      (value) => !cancelled && setAccount(value),
      (err) => !cancelled && setError(describeError(err)),
    );
    getInstitutionOverview().then(
      (value) => !cancelled && setInstitution(value),
      () => undefined, // the institution is extra detail: the page works without it
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const startEditing = () => {
    setSaved(false);
    setEditing(true);
  };

  const onSaved = (changes: Pick<MyAccount, 'name' | 'phone'>) => {
    setAccount((current) => current && { ...current, ...changes });
    updateUser({ name: changes.name }); // the sidebar shows the name too
    setEditing(false);
    setSaved(true);
  };

  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Profile</h1>
        <p>Your details on SignConnect.</p>
      </header>

      {error && (
        <p className="sh-alert" role="alert">
          {error}
        </p>
      )}
      {!error && !account && <p className="sh-note">Loading your profile…</p>}

      {account && (
        <section className="sp-card" aria-label="Your details">
          <div className="sp-hero">
            <span className="sp-avatar" aria-hidden="true">
              {initials(account.name)}
            </span>
            <div>
              <strong>{account.name}</strong>
              <span>{institution ? institution.name : 'Institution staff'}</span>
            </div>
            {!editing && (
              <button type="button" className="sp-btn sp-btn--ghost" onClick={startEditing}>
                Edit
              </button>
            )}
          </div>

          {saved && (
            <p className="sp-ok" role="status">
              Your details have been saved.
            </p>
          )}

          {editing && (
            <EditDetailsForm
              account={account}
              onSaved={onSaved}
              onCancel={() => setEditing(false)}
            />
          )}

          <dl className="sp-rows">
            {!editing && (
              <>
                <div>
                  <dt>Full name</dt>
                  <dd>{account.name}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{account.phone}</dd>
                </div>
              </>
            )}
            <div>
              <dt>Email</dt>
              <dd>
                {account.email ?? 'None on this account'}
                {account.email && (
                  <span className={account.emailVerified ? 'sp-badge' : 'sp-badge sp-badge--warn'}>
                    {account.emailVerified ? 'Verified' : 'Not verified'}
                  </span>
                )}
              </dd>
            </div>
            {institution && (
              <>
                <div>
                  <dt>Institution</dt>
                  <dd>{institution.name}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{institution.role === 'ADMIN' ? 'Administrator' : 'Staff'}</dd>
                </div>
              </>
            )}
          </dl>
          <p>
            Your email, department and role are changed by your institution’s administrator. You can
            change your password in <Link to="/dashboard/staff/settings">Settings</Link>.
          </p>
        </section>
      )}
    </div>
  );
}

type Field = 'name' | 'phone';
const ORDER: readonly Field[] = ['name', 'phone'];
const SERVER_FIELDS: Record<Field, string> = { name: 'full_name', phone: 'phone_number' };
const fieldId = (name: Field) => `staff-profile-${name}`;

interface EditDetailsFormProps {
  account: MyAccount;
  onSaved: (changes: Pick<MyAccount, 'name' | 'phone'>) => void;
  onCancel: () => void;
}

/** Name and phone number: the two details staff may change themselves. */
function EditDetailsForm({ account, onSaved, onCancel }: EditDetailsFormProps) {
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone);
  // A field's message from the server (e.g. phone number already used), until that field changes.
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const errors = collectErrors<Field>({
    name: validateName(name) ?? serverErrors.name,
    phone: validatePhone(phone) ?? serverErrors.phone,
  });
  const { shown, touch, fieldProps, check } = useFieldErrors(errors, ORDER, fieldId);

  const setters: Record<Field, (value: string) => void> = { name: setName, phone: setPhone };
  const change = (field: Field) => (value: string) => {
    setters[field](value);
    setServerErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!check()) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile({ fullName: name, phone });
      onSaved({ name: updated.name, phone: updated.phone });
    } catch (err) {
      const byField =
        err instanceof ApiError
          ? collectErrors<Field>({
              name: err.fieldError(SERVER_FIELDS.name),
              phone: err.fieldError(SERVER_FIELDS.phone),
            })
          : {};
      if (Object.keys(byField).length > 0) setServerErrors(byField);
      else setError(describeError(err));
      setSaving(false);
    }
  };

  return (
    <form className="sp-form" onSubmit={submit} noValidate aria-label="Edit your details">
      <div className="sp-field">
        <label htmlFor={fieldId('name')}>Full name</label>
        <input
          {...fieldProps('name')}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => change('name')(e.target.value)}
        />
        <FieldError id={fieldId('name')} message={shown('name')} />
      </div>
      <div className="sp-field">
        <label htmlFor={fieldId('phone')}>Phone number</label>
        <PhoneField
          id={fieldId('phone')}
          value={phone}
          onChange={change('phone')}
          onBlur={touch('phone')}
          invalid={Boolean(shown('phone'))}
          errorId={shown('phone') ? `${fieldId('phone')}-error` : undefined}
        />
        <FieldError id={fieldId('phone')} message={shown('phone')} />
      </div>
      {error && (
        <p className="sp-error" role="alert">
          {error}
        </p>
      )}
      <div className="sp-actions">
        <button type="submit" className="sp-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="sp-btn sp-btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
