import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft, Clock, Minus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { collectErrors, validateName } from '../../lib/validation';
import { describeError } from '../../services/api';
import {
  DEPARTMENTS,
  getStaff,
  lastActiveLabel,
  reinstateStaff,
  revokeStaff,
  updateStaff,
  type StaffMember,
  type StaffStatus,
} from '../../services/staff';
import './StaffProfilePage.css';

// V2-006: one staff member, opened from "View profile" on the staff list. The institution admin
// edits their name, department and role, and revokes or reinstates their access.

const ROLES = ['Staff', 'Admin'] as const;

function statusBadge(status: StaffStatus) {
  if (status === 'Active')
    return (
      <span className="sp-badge sp-badge--active">
        <Check size={12} /> Active
      </span>
    );
  if (status === 'Invitation Sent')
    return (
      <span className="sp-badge sp-badge--pending">
        <Clock size={12} /> Invitation Sent
      </span>
    );
  return (
    <span className="sp-badge sp-badge--inactive">
      <Minus size={12} /> Inactive
    </span>
  );
}

export function StaffProfilePage() {
  const { id = '' } = useParams();
  const { session } = useAuth();
  const [person, setPerson] = useState<StaffMember>();
  const [loadError, setLoadError] = useState<string>();

  // Edit form
  const [form, setForm] = useState({ fullName: '', department: '', role: 'Staff' as string });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // Access (revoke / reinstate)
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [changingAccess, setChangingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string>();

  const showPerson = (p: StaffMember) => {
    setPerson(p);
    setForm({ fullName: p.name, department: p.department, role: p.role });
  };

  useEffect(() => {
    let active = true;
    getStaff(id)
      .then((p) => active && showPerson(p))
      .catch((err) => active && setLoadError(describeError(err)));
    return () => {
      active = false;
    };
  }, [id]);

  const errors = collectErrors({
    fullName: validateName(form.fullName, 'the staff member’s full name'),
  });
  const isMe = person?.userId === session?.user.id;
  // Departments saved before the list existed (or typed elsewhere) still show as an option.
  const departments =
    form.department && !DEPARTMENTS.includes(form.department)
      ? [form.department, ...DEPARTMENTS]
      : DEPARTMENTS;

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!person || errors.fullName) return;
    setSaveError(undefined);
    setSaved(false);
    setSaving(true);
    try {
      showPerson(
        await updateStaff(person.id, {
          fullName: form.fullName,
          department: form.department,
          role: form.role as (typeof ROLES)[number],
        }),
      );
      setSaved(true);
    } catch (err) {
      // e.g. "Your institution must keep at least one active administrator."
      setSaveError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const changeAccess = async (action: typeof revokeStaff) => {
    if (!person) return;
    setAccessError(undefined);
    setSaved(false); // an earlier "Changes saved." is about the edit form, not this
    setChangingAccess(true);
    try {
      showPerson(await action(person.id));
      setConfirmingRevoke(false);
    } catch (err) {
      setAccessError(describeError(err));
    } finally {
      setChangingAccess(false);
    }
  };

  if (loadError) {
    return (
      <>
        <BackLink />
        <p className="sp-alert" role="alert">
          {loadError}
        </p>
      </>
    );
  }
  if (!person) {
    return (
      <>
        <BackLink />
        <p className="sp-muted">Loading…</p>
      </>
    );
  }

  return (
    <>
      <BackLink />

      {/* Header */}
      <div className="sp-header">
        <span className="sp-avatar" aria-hidden="true">
          {person.initials}
        </span>
        <div>
          <h1>{person.name}</h1>
          <p>
            {person.role} · {person.department || 'No department'}
          </p>
        </div>
        <div className="sp-header-status">{statusBadge(person.status)}</div>
      </div>

      <div className="sp-grid">
        {/* Details */}
        <section className="sp-card" aria-labelledby="sp-details-title">
          <h2 id="sp-details-title">Details</h2>
          <dl className="sp-details">
            <dt>Email</dt>
            <dd>{person.email || '—'}</dd>
            <dt>Phone number</dt>
            <dd>{person.phone || '—'}</dd>
            <dt>Last active</dt>
            <dd>
              {person.status === 'Invitation Sent'
                ? 'Not signed in yet'
                : lastActiveLabel(person.lastLogin)}
            </dd>
          </dl>
          <p className="sp-note">
            Email and phone number are the person’s sign-in details, so only they can change them.
          </p>
        </section>

        {/* Edit */}
        <section className="sp-card" aria-labelledby="sp-edit-title">
          <h2 id="sp-edit-title">Edit staff member</h2>
          <form onSubmit={onSave} noValidate>
            <div className="sp-field">
              <label htmlFor="sp-fullName">Full name</label>
              <input
                id="sp-fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fullName: e.target.value }));
                  setSaved(false);
                }}
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={errors.fullName ? 'sp-fullName-error' : undefined}
                className={errors.fullName ? 'sp-input sp-input--error' : 'sp-input'}
              />
              {errors.fullName && (
                <p className="sp-field-error" id="sp-fullName-error">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="sp-field">
              <label htmlFor="sp-department">Department</label>
              <div className="sp-select-wrap">
                <select
                  id="sp-department"
                  className="sp-input"
                  value={form.department}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, department: e.target.value }));
                    setSaved(false);
                  }}
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="sp-select-icon" />
              </div>
            </div>

            <div className="sp-field">
              <label htmlFor="sp-role">Role</label>
              <div className="sp-select-wrap">
                <select
                  id="sp-role"
                  className="sp-input"
                  value={form.role}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, role: e.target.value }));
                    setSaved(false);
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="sp-select-icon" />
              </div>
              <p className="sp-hint">Admins can also manage staff accounts.</p>
            </div>

            {saveError && (
              <p className="sp-alert" role="alert">
                {saveError}
              </p>
            )}
            {saved && (
              <p className="sp-success" role="status">
                Changes saved.
              </p>
            )}

            <button type="submit" className="sp-btn sp-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        {/* Access */}
        <section className="sp-card sp-card--wide" aria-labelledby="sp-access-title">
          <h2 id="sp-access-title">Access</h2>
          {person.status === 'Inactive' ? (
            <>
              <p className="sp-muted">
                {person.name}’s access has been revoked. They cannot sign in until you reinstate
                them.
              </p>
              <button
                type="button"
                className="sp-btn sp-btn--primary"
                disabled={changingAccess}
                onClick={() => changeAccess(reinstateStaff)}
              >
                {changingAccess ? 'Reinstating…' : 'Reinstate access'}
              </button>
            </>
          ) : isMe ? (
            <p className="sp-muted">
              This is your own account. Another administrator can revoke it.
            </p>
          ) : confirmingRevoke ? (
            <div className="sp-confirm" role="alertdialog" aria-labelledby="sp-confirm-text">
              <p id="sp-confirm-text">
                Revoke {person.name}’s access? They will be signed out straight away and cannot sign
                in again until you reinstate them.
              </p>
              <div className="sp-confirm-actions">
                <button
                  type="button"
                  className="sp-btn sp-btn--danger"
                  disabled={changingAccess}
                  onClick={() => changeAccess(revokeStaff)}
                >
                  {changingAccess ? 'Revoking…' : 'Yes, revoke access'}
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--outline"
                  disabled={changingAccess}
                  onClick={() => setConfirmingRevoke(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="sp-muted">
                Revoke access when someone leaves or should no longer use SignConnect. Their history
                is kept.
              </p>
              <button
                type="button"
                className="sp-btn sp-btn--danger-outline"
                onClick={() => setConfirmingRevoke(true)}
              >
                Revoke access
              </button>
            </>
          )}
          {accessError && (
            <p className="sp-alert" role="alert">
              {accessError}
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/dashboard/institution/staff" className="sp-back">
      <ChevronLeft size={16} /> Back to staff
    </Link>
  );
}
