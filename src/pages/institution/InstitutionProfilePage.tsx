import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Mail,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { describeError } from '../../services/api';
import {
  createMyDepartment,
  deleteMyDepartment,
  fetchMyDepartments,
  fetchMyInstitutionProfile,
  renameMyDepartment,
  updateMyInstitutionProfile,
  type InstitutionDepartment,
  type InstitutionProfile,
} from '../../services/institutions';
// One look for every profile: this is the Deaf user's profile stylesheet.
import '../deaf/ProfilePage.css';

const EMPTY: InstitutionProfile = { name: '', email: '', phone: '', type: '', description: '' };
const INITIAL_DEPARTMENT_LIMIT = 7;
const DEPARTMENT_PAGE_SIZE = 5;
const TYPES = [
  ['HOSPITAL', 'Hospital or clinic'],
  ['COURT', 'Court'],
  ['GOVERNMENT', 'Government Office'],
  ['SCHOOL', 'School or Institution'],
  ['POLICE', 'Police Station'],
  ['CHURCH', 'Church'],
  ['OTHER', 'Other'],
];

/**
 * The institution's own profile, for its administrator. Looks like the Deaf user's profile.
 * It opens in "viewing" mode (everything greyed out). Edit profile switches to "editing" mode:
 * the details unlock, and departments can be added, renamed and deleted.
 */
export function InstitutionProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
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

  // Messages go away by themselves after 5 seconds.
  useEffect(() => {
    if (!error && !notice) return;
    const timeout = window.setTimeout(() => {
      setError('');
      setNotice('');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyInstitutionProfile(), fetchMyDepartments()])
      .then(([nextProfile, nextDepartments]) => {
        if (cancelled) return;
        setProfile(nextProfile);
        setDraft(nextProfile);
        setDepartments(nextDepartments);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startEditing = () => {
    setDraft(profile);
    setError('');
    setNotice('');
    setEditing(true);
  };

  // Cancel puts the saved details back and returns to viewing. Department changes were already saved.
  const cancelEditing = () => {
    setDraft(profile);
    setAdding(false);
    setNewName('');
    setEditingId(null);
    setEditing(false);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateMyInstitutionProfile(draft);
      setProfile(updated);
      setDraft(updated);
      setAdding(false);
      setEditingId(null);
      setEditing(false);
      setNotice('Institution details saved.');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setNotice('');
    try {
      const added = await createMyDepartment(newName);
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
    try {
      const updated = await renameMyDepartment(id, departmentDraft);
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

  const activeDepartments = departments.filter((item) => item.active);

  // While viewing, show what is saved. While editing, show what is being typed.
  const shownProfile = editing ? draft : profile;

  return (
    <div className={`pr-page${editing ? ' pr-page--editing' : ''}`}>
      <div className="pr-header">
        <div>
          <div className="pr-title-row">
            <h1>{editing ? 'Edit Institution Profile' : 'Institution Profile'}</h1>
            <span className={`pr-mode${editing ? ' pr-mode--edit' : ''}`}>
              {editing ? 'Editing' : 'Viewing'}
            </span>
          </div>
          <p>
            {editing
              ? 'Change your institution details and departments, then save.'
              : 'View your institution details and departments.'}
          </p>
        </div>
        <button
          type="button"
          className="pr-back"
          onClick={() => navigate('/dashboard/institution')}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`pr-banner ${error ? 'pr-banner--error' : 'pr-banner--success'}`}
          role={error ? 'alert' : 'status'}
        >
          {error ? <AlertCircle size={15} /> : <Check size={15} />} {error || notice}
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <p className="pr-hint">Loading institution profile…</p>
      ) : (
        <div className="pr-columns">
          {/* LEFT: the institution's details */}
          <div className="pr-left">
            <form
              id="institution-profile-form"
              className="pr-card"
              onSubmit={(e) => void saveProfile(e)}
            >
              <h2>
                <Building2 size={15} /> Institution details
              </h2>
              <div className="pr-grid">
                <div className="pr-field pr-field--full">
                  <label htmlFor="institution-name">Institution name</label>
                  <input
                    id="institution-name"
                    required
                    value={shownProfile.name}
                    disabled={!editing}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>

                <div className="pr-field pr-field--full">
                  <label htmlFor="institution-type">Institution type</label>
                  <select
                    id="institution-type"
                    required
                    value={shownProfile.type}
                    disabled={!editing}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  >
                    <option value="">Select institution type</option>
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pr-field">
                  <label htmlFor="institution-email">Email address</label>
                  <div className="pr-input">
                    <Mail size={14} />
                    <input
                      id="institution-email"
                      required
                      type="email"
                      value={shownProfile.email}
                      disabled={!editing}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pr-field">
                  <label htmlFor="institution-phone">Phone number</label>
                  <div className="pr-input">
                    <Phone size={14} />
                    <input
                      id="institution-phone"
                      required
                      type="tel"
                      value={shownProfile.phone}
                      disabled={!editing}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pr-field pr-field--full">
                  <label htmlFor="institution-description">Description</label>
                  <textarea
                    id="institution-description"
                    rows={3}
                    value={shownProfile.description}
                    disabled={!editing}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: departments, then the buttons */}
          <div className="pr-right">
            <div className="pr-card">
              <div className="pr-card-head">
                <h2>
                  <Users size={15} /> Departments
                </h2>
                {editing && (
                  <button
                    type="button"
                    className="pr-btn pr-btn--ghost pr-btn--small"
                    onClick={() => setAdding((value) => !value)}
                  >
                    <Plus size={14} /> {adding ? 'Close' : 'Add department'}
                  </button>
                )}
              </div>

              {editing && adding && (
                <form className="pr-add-row" onSubmit={(e) => void addDepartment(e)}>
                  <input
                    aria-label="New department name"
                    autoFocus
                    required
                    maxLength={100}
                    placeholder="Department name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button type="submit" className="pr-btn pr-btn--primary pr-btn--small">
                    <Plus size={14} /> Add
                  </button>
                </form>
              )}

              <ul className="pr-rows">
                {activeDepartments.slice(0, visibleDepartmentCount).map((department) => (
                  <li className="pr-row" key={department.id}>
                    {editing && editingId === department.id ? (
                      <input
                        aria-label="Department name"
                        value={departmentDraft}
                        onChange={(e) => setDepartmentDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveDepartment(department.id);
                        }}
                      />
                    ) : (
                      <span className="pr-row-name">{department.name}</span>
                    )}

                    <span className="pr-badge pr-badge--ok">Active</span>

                    {editing && (
                      <>
                        {editingId === department.id ? (
                          <button
                            type="button"
                            className="pr-icon-btn"
                            aria-label="Save department"
                            onClick={() => void saveDepartment(department.id)}
                          >
                            <Check size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="pr-icon-btn"
                            aria-label={`Edit ${department.name}`}
                            onClick={() => {
                              setEditingId(department.id);
                              setDepartmentDraft(department.name);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="pr-icon-btn pr-icon-btn--danger"
                          aria-label={`Delete ${department.name}`}
                          onClick={() => setDepartmentToDelete(department)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {!activeDepartments.length && (
                <p className="pr-empty">
                  No departments yet. Add the departments your institution uses.
                </p>
              )}

              {activeDepartments.length > visibleDepartmentCount && (
                <button
                  type="button"
                  className="pr-more"
                  onClick={() => setVisibleDepartmentCount((count) => count + DEPARTMENT_PAGE_SIZE)}
                >
                  View more departments ({activeDepartments.length - visibleDepartmentCount}{' '}
                  remaining)
                </button>
              )}

              {editing && (
                <p className="pr-hint">
                  Department changes are saved straight away. Only the details on the left need Save
                  changes.
                </p>
              )}
            </div>

            <div className="pr-actions pr-actions--inline">
              {editing ? (
                <>
                  <button
                    type="button"
                    className="pr-btn pr-btn--ghost"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="institution-profile-form"
                    className="pr-btn pr-btn--primary"
                    disabled={saving}
                  >
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
        </div>
      )}

      <ConfirmDialog
        open={departmentToDelete !== null}
        variant="danger"
        title="Delete department?"
        message={`Delete ${departmentToDelete?.name ?? ''}? Staff assigned to this department may need to be reassigned first.`}
        confirmLabel={deletingDepartment ? 'Deleting…' : 'Delete department'}
        error={departmentToDelete ? error : ''}
        busy={deletingDepartment}
        onConfirm={() => void removeDepartment()}
        onClose={() => {
          if (!deletingDepartment) setDepartmentToDelete(null);
        }}
      />
    </div>
  );
}
