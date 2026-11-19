import { useEffect, useState, type FormEvent } from 'react';
import {
  Building2,
  Check,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
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
import './InstitutionProfilePage.css';

const EMPTY: InstitutionProfile = { name: '', email: '', phone: '', type: '', description: '' };
const TYPES = [
  ['HOSPITAL', 'Hospital or clinic'],
  ['COURT', 'Court'],
  ['GOVERNMENT', 'Government Office'],
  ['SCHOOL', 'School or Institution'],
  ['POLICE', 'Police Station'],
  ['CHURCH', 'Church'],
  ['OTHER', 'Other'],
];

export function InstitutionProfilePage() {
  const [profile, setProfile] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [departments, setDepartments] = useState<InstitutionDepartment[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departmentDraft, setDepartmentDraft] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextDepartments] = await Promise.all([
        fetchMyInstitutionProfile(),
        fetchMyDepartments(),
      ]);
      setProfile(nextProfile);
      setDraft(nextProfile);
      setDepartments(nextDepartments);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };
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

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateMyInstitutionProfile(draft);
      setProfile(updated);
      setDraft(updated);
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
  const removeDepartment = async (department: InstitutionDepartment) => {
    if (!window.confirm(`Delete ${department.name}? Staff assigned to it may need reassignment.`))
      return;
    setError('');
    try {
      await deleteMyDepartment(department.id);
      setDepartments((items) => items.filter((item) => item.id !== department.id));
      setNotice('Department deleted.');
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <main className="institution-profile">
      <header className="ip-header">
        <div>
          <h1>Institution Profile</h1>
          <p>Manage and update your institution details.</p>
        </div>
        {!editing && (
          <button
            className="ip-primary"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
          >
            <Pencil size={17} /> Edit Profile
          </button>
        )}
      </header>
      {error && (
        <p className="ip-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ip-notice" role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <div className="ip-loading">Loading institution profile…</div>
      ) : (
        <>
          <div className="ip-grid">
            <section className="ip-card">
              <div className="ip-card-heading">
                <Building2 />
                <div>
                  <h2>Institution Details</h2>
                  <p>Update your institution information.</p>
                </div>
              </div>
              <form onSubmit={saveProfile}>
                <label className="ip-field">
                  Institution Name <b>*</b>
                  <input
                    required
                    value={editing ? draft.name : profile.name}
                    readOnly={!editing}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </label>
                <label className="ip-field">
                  Institution Type <b>*</b>
                  <select
                    required
                    disabled={!editing}
                    value={editing ? draft.type : profile.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  >
                    <option value="">Select institution type</option>
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ip-field">
                  Email Address <b>*</b>
                  <span className="ip-input-icon">
                    <Mail size={18} />
                    <input
                      required
                      type="email"
                      value={editing ? draft.email : profile.email}
                      readOnly={!editing}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    />
                  </span>
                </label>
                <label className="ip-field">
                  Phone Number <b>*</b>
                  <span className="ip-input-icon">
                    <Phone size={18} />
                    <input
                      required
                      type="tel"
                      value={editing ? draft.phone : profile.phone}
                      readOnly={!editing}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    />
                  </span>
                </label>
                <label className="ip-field">
                  Description
                  <textarea
                    rows={3}
                    value={editing ? draft.description : profile.description}
                    readOnly={!editing}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </label>
                {editing && (
                  <div className="ip-actions">
                    <button
                      type="button"
                      className="ip-secondary"
                      onClick={() => {
                        setDraft(profile);
                        setEditing(false);
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button className="ip-primary" disabled={saving}>
                      <Check size={16} />
                      {saving ? 'Saving…' : 'Save Changes'}
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
                <button className="ip-outline" onClick={() => setAdding((value) => !value)}>
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
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button className="ip-primary">
                    <Plus size={16} /> Add
                  </button>
                </form>
              )}
              <div className="ip-department-list">
                {departments
                  .filter((item) => item.active)
                  .map((department) => (
                    <div className="ip-department" key={department.id}>
                      <span className="ip-dept-icon">
                        <Users size={18} />
                      </span>
                      {editingId === department.id ? (
                        <input
                          aria-label="Department name"
                          value={departmentDraft}
                          onChange={(e) => setDepartmentDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveDepartment(department.id);
                          }}
                        />
                      ) : (
                        <span className="ip-dept-name">{department.name}</span>
                      )}
                      <span className="ip-active">Active</span>
                      {editingId === department.id ? (
                        <button
                          className="ip-icon-button"
                          aria-label="Save department"
                          onClick={() => void saveDepartment(department.id)}
                        >
                          <Check />
                        </button>
                      ) : (
                        <button
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
                        className="ip-icon-button ip-delete"
                        aria-label={`Delete ${department.name}`}
                        onClick={() => void removeDepartment(department)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  ))}
                {!departments.some((item) => item.active) && (
                  <p className="ip-empty">
                    No departments yet. Add the departments your institution uses.
                  </p>
                )}
              </div>
            </section>
          </div>
          <div className="ip-footer">
            <button
              className="ip-secondary"
              onClick={() => {
                setDraft(profile);
                void load();
              }}
            >
              <RotateCcw size={17} /> Reset Changes
            </button>
          </div>
        </>
      )}
    </main>
  );
}
