import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Check, Pencil, Plus, RotateCcw, Save, Trash2, Users, X } from 'lucide-react';
import {
  createMyDepartment,
  deleteMyDepartment,
  fetchMyDepartments,
  fetchMyInstitutionAccount,
  renameMyDepartment,
  updateMyInstitutionAccount,
  type InstitutionDepartment,
  type MyInstitutionAccount,
  type OrganisationType,
} from '../../services/institutions';
import { describeError } from '../../services/api';
import './InstitutionProfilePage.css';

const EMPTY_PROFILE: MyInstitutionAccount = {
  organisation_name: '',
  organisation_type: 'SCHOOL',
  organisation_type_other: '',
};

const INITIAL_DEPARTMENT_LIMIT = 7;
const DEPARTMENT_PAGE_SIZE = 5;

const ORGANISATION_TYPES: { value: OrganisationType; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital / health facility' },
  { value: 'COURT', label: 'Court / legal' },
  { value: 'GOVERNMENT', label: 'Government office' },
  { value: 'SCHOOL', label: 'School or Institution' },
  { value: 'POLICE', label: 'Police Station' },
  { value: 'CHURCH', label: 'Church' },
  { value: 'OTHER', label: 'Other' },
];

export function InstitutionProfilePage() {
  const [profile, setProfile] = useState<MyInstitutionAccount>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<MyInstitutionAccount>(EMPTY_PROFILE);

  const [departments, setDepartments] = useState<InstitutionDepartment[]>([]);
  const [visibleDepartmentCount, setVisibleDepartmentCount] = useState(INITIAL_DEPARTMENT_LIMIT);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentDraft, setDepartmentDraft] = useState('');

  const [departmentToDelete, setDepartmentToDelete] = useState<InstitutionDepartment | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState(false);

  const load = useCallback(async () => {
    return Promise.all([fetchMyInstitutionAccount(), fetchMyDepartments()]);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [nextProfile, nextDepartments] = await load();

        if (!active) return;

        setProfile(nextProfile);
        setDraft(nextProfile);
        setDepartments(nextDepartments);
        setVisibleDepartmentCount(INITIAL_DEPARTMENT_LIMIT);
      } catch (err) {
        if (active) {
          setError(describeError(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (!error && !notice) return;

    const timeout = window.setTimeout(() => {
      setError('');
      setNotice('');
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  const initials = profile.organisation_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  const selectedType = ORGANISATION_TYPES.find((type) => type.value === profile.organisation_type);

  const activeDepartments = departments.filter((item) => item.active);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setNotice('');

    if (!draft.organisation_name.trim()) {
      setError('Organisation name is required.');
      return;
    }

    if (draft.organisation_type === 'OTHER' && !draft.organisation_type_other.trim()) {
      setError('Please specify the type of organisation.');
      return;
    }

    setSaving(true);

    try {
      const response = await updateMyInstitutionAccount({
        organisation_name: draft.organisation_name.trim(),
        organisation_type: draft.organisation_type,
        organisation_type_other:
          draft.organisation_type === 'OTHER' ? draft.organisation_type_other.trim() : '',
      });

      setProfile(response.updated_data);
      setDraft(response.updated_data);
      setEditing(false);

      setNotice(response.message || 'Institution profile updated successfully.');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newName.trim()) return;

    setError('');
    setNotice('');

    try {
      const added = await createMyDepartment(newName.trim());

      setDepartments((items) => [...items, added]);
      setNewName('');
      setAdding(false);
      setNotice('Department added.');
    } catch (err) {
      setError(describeError(err));
    }
  };

  const saveDepartment = async (id: string) => {
    if (!departmentDraft.trim()) return;

    setError('');
    setNotice('');

    try {
      const updated = await renameMyDepartment(id, departmentDraft.trim());

      setDepartments((items) => items.map((item) => (item.id === id ? updated : item)));

      setEditingId(null);
      setNotice('Department updated.');
    } catch (err) {
      setError(describeError(err));
    }
  };

  const removeDepartment = async () => {
    if (!departmentToDelete) return;

    const department = departmentToDelete;

    setDeletingDepartment(true);
    setError('');
    setNotice('');

    try {
      await deleteMyDepartment(department.id);

      setDepartments((items) => items.filter((item) => item.id !== department.id));

      setNotice('Department deleted.');
      setDepartmentToDelete(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setDeletingDepartment(false);
    }
  };

  if (loading) {
    return (
      <main className="institution-profile">
        <div className="ip-loading">Loading institution profile...</div>
      </main>
    );
  }

  return (
    <main className="institution-profile">
      <header className="ip-header">
        <div>
          <h1>Institution Profile</h1>
          <p>Manage and update your institution details.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="ip-primary"
            onClick={() => {
              setDraft({ ...profile });
              setEditing(true);
            }}
          >
            <Pencil size={17} /> Edit Profile
          </button>
        )}
      </header>

      {(error || notice) && (
        <div
          className={`ip-toast ${error ? 'ip-toast--error' : 'ip-toast--success'}`}
          role={error ? 'alert' : 'status'}
        >
          <span>{error || notice}</span>

          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="ip-grid">
        <section className="ip-card">
          <div className="ip-card-heading">
            <Building2 />

            <div>
              <h2>Institution Details</h2>
              <p>View and update your institution information.</p>
            </div>
          </div>

          <div className="ip-profile-summary">
            <div className="profile-avatar-large">{initials || <Building2 size={30} />}</div>

            <div>
              <h3>{profile.organisation_name || 'Institution'}</h3>
              <p>
                {selectedType?.label || profile.organisation_type}
                {profile.organisation_type === 'OTHER' &&
                  profile.organisation_type_other &&
                  ` · ${profile.organisation_type_other}`}
              </p>
            </div>
          </div>

          <form id="institution-profile-form" onSubmit={saveProfile}>
            <label className="ip-field">
              Organisation Name <b>*</b>
              <input
                required
                maxLength={200}
                value={draft.organisation_name}
                disabled={!editing || saving}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    organisation_name: event.target.value,
                  })
                }
              />
            </label>

            <label className="ip-field">
              Organisation Type <b>*</b>
              <select
                required
                value={draft.organisation_type}
                disabled={!editing || saving}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    organisation_type: event.target.value as OrganisationType,
                    organisation_type_other: '',
                  })
                }
              >
                {ORGANISATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            {draft.organisation_type === 'OTHER' && (
              <label className="ip-field">
                Specify Organisation Type <b>*</b>
                <input
                  required
                  maxLength={100}
                  placeholder="Enter organisation type"
                  value={draft.organisation_type_other}
                  disabled={!editing || saving}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      organisation_type_other: event.target.value,
                    })
                  }
                />
              </label>
            )}

            {editing && (
              <div className="ip-actions">
                <button
                  type="button"
                  className="ip-secondary"
                  disabled={saving}
                  onClick={() => {
                    setDraft({ ...profile });
                    setEditing(false);
                    setError('');
                  }}
                >
                  <X size={16} /> Cancel
                </button>

                <button type="submit" className="ip-primary" disabled={saving}>
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="ip-card ip-departments">
          <div className="ip-card-heading">
            <Users />

            <div>
              <h2>Departments</h2>
              <p>Manage the departments under your institution.</p>
            </div>

            <button
              type="button"
              className="ip-outline"
              onClick={() => setAdding((value) => !value)}
            >
              <Plus size={18} />
              {adding ? 'Close' : 'Add Department'}
            </button>
          </div>

          {adding && (
            <form className="ip-add" onSubmit={addDepartment}>
              <input
                aria-label="New department name"
                autoFocus
                required
                maxLength={100}
                placeholder="Department name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />

              <button type="submit" className="ip-primary">
                <Plus size={16} /> Add
              </button>
            </form>
          )}

          <div className="ip-department-list">
            {activeDepartments.slice(0, visibleDepartmentCount).map((department) => (
              <div className="ip-department" key={department.id}>
                <span className="ip-dept-icon">
                  <Users size={18} />
                </span>

                {editingId === department.id ? (
                  <input
                    aria-label="Department name"
                    value={departmentDraft}
                    onChange={(event) => setDepartmentDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void saveDepartment(department.id);
                      }
                    }}
                  />
                ) : (
                  <span className="ip-dept-name">{department.name}</span>
                )}

                <span className="ip-active">Active</span>

                {editingId === department.id ? (
                  <button
                    type="button"
                    className="ip-icon-button"
                    aria-label="Save department"
                    onClick={() => void saveDepartment(department.id)}
                  >
                    <Check />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ip-icon-button"
                    aria-label={`Edit ${department.name}`}
                    onClick={() => {
                      setEditingId(department.id);
                      setDepartmentDraft(department.name);
                    }}
                  >
                    <Pencil />
                  </button>
                )}

                <button
                  type="button"
                  className="ip-icon-button ip-delete"
                  aria-label={`Delete ${department.name}`}
                  onClick={() => setDepartmentToDelete(department)}
                >
                  <Trash2 />
                </button>
              </div>
            ))}

            {!activeDepartments.length && (
              <p className="ip-empty">
                No departments yet. Add the departments your institution uses.
              </p>
            )}

            {activeDepartments.length > visibleDepartmentCount && (
              <button
                type="button"
                className="ip-view-more"
                onClick={() => setVisibleDepartmentCount((count) => count + DEPARTMENT_PAGE_SIZE)}
              >
                View more departments ({activeDepartments.length - visibleDepartmentCount}{' '}
                remaining)
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="ip-footer">
        <button
          type="button"
          className="ip-secondary"
          onClick={async () => {
            setError('');
            setNotice('');
            setLoading(true);

            try {
              const [nextProfile, nextDepartments] = await load();

              setProfile(nextProfile);
              setDraft(nextProfile);
              setDepartments(nextDepartments);
              setVisibleDepartmentCount(INITIAL_DEPARTMENT_LIMIT);
              setEditing(false);
            } catch (err) {
              setError(describeError(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          <RotateCcw size={17} /> Reset Changes
        </button>
      </div>

      {departmentToDelete && (
        <div
          className="ip-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingDepartment) {
              setDepartmentToDelete(null);
            }
          }}
        >
          <section
            className="ip-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ip-dialog-title"
            aria-describedby="ip-dialog-description"
          >
            <span className="ip-dialog-icon">
              <Trash2 size={22} />
            </span>

            <h2 id="ip-dialog-title">Delete department?</h2>

            <p id="ip-dialog-description">
              Delete <strong>{departmentToDelete.name}</strong>? Staff assigned to this department
              may need to be reassigned first.
            </p>

            {error && (
              <p className="ip-dialog-error" role="alert">
                {error}
              </p>
            )}

            <div className="ip-dialog-actions">
              <button
                type="button"
                className="ip-secondary"
                disabled={deletingDepartment}
                onClick={() => setDepartmentToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ip-danger"
                disabled={deletingDepartment}
                onClick={() => void removeDepartment()}
              >
                {deletingDepartment ? 'Deleting...' : 'Delete department'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
