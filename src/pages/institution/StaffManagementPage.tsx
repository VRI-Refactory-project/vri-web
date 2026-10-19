import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ChevronRight, Check, Clock, Minus } from 'lucide-react';
import './StaffManagementPage.css';
import { Link } from 'react-router-dom';
import { describeError } from '../../services/api';
import {
  lastActiveLabel,
  listStaff,
  type StaffMember,
  type StaffStatus,
} from '../../services/staff';

const STATUSES: StaffStatus[] = ['Active', 'Invitation Sent', 'Inactive'];

function statusBadge(status: StaffStatus) {
  if (status === 'Active')
    return (
      <span className="sm-badge sm-badge--active">
        <Check size={12} /> Active
      </span>
    );
  if (status === 'Invitation Sent')
    return (
      <span className="sm-badge sm-badge--pending">
        <Clock size={12} /> Invitation Sent
      </span>
    );
  return (
    <span className="sm-badge sm-badge--inactive">
      <Minus size={12} /> Inactive
    </span>
  );
}

export function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    listStaff()
      .then((rows) => active && setStaff(rows))
      .catch((err) => active && setError(describeError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () => [...new Set(staff.map((s) => s.department).filter(Boolean))].sort(),
    [staff],
  );

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter(
      (s) =>
        (!query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)) &&
        (!department || s.department === department) &&
        (!status || s.status === status),
    );
  }, [staff, search, department, status]);

  const count = (value: StaffStatus) => staff.filter((s) => s.status === value).length;

  return (
    <>
      {/* Header */}
      <div className="sm-header">
        <div>
          <h1>Staff Management</h1>
          <p>Manage staff accounts, roles and access across your institution.</p>
        </div>
        <Link to="/dashboard/institution/staff/new" className="sm-btn-primary">
          <Plus size={16} /> Create Staff Account
        </Link>
      </div>

      {/* Summary card */}
      <div className="sm-summary">
        <div className="sm-summary-icon">
          <UsersIcon />
        </div>
        <div>
          <strong>
            {staff.length} Staff {staff.length === 1 ? 'Member' : 'Members'}
          </strong>
          <span>
            {count('Active')} active · {count('Invitation Sent')} invitations pending ·{' '}
            {count('Inactive')} inactive
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="sm-filters">
        <div className="sm-search">
          <Search size={16} />
          <input
            placeholder="Search staff by name or email"
            aria-label="Search staff by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sm-select"
          aria-label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="sm-select"
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="sm-table">
        <div className="sm-thead">
          <span>Staff Member</span>
          <span>Department</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last Active</span>
          <span></span>
        </div>
        {loading && <p className="sm-message">Loading staff…</p>}
        {error && (
          <p className="sm-message sm-message--error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && staff.length === 0 && (
          <p className="sm-message">No staff accounts yet. Create the first one.</p>
        )}
        {!loading && !error && staff.length > 0 && shown.length === 0 && (
          <p className="sm-message">No staff match your search or filters.</p>
        )}
        {shown.map((person) => (
          <div key={person.id} className="sm-row">
            <div className="sm-member">
              <span className="sm-avatar">{person.initials}</span>
              <strong>{person.name}</strong>
            </div>
            <span className="sm-cell">{person.department || '—'}</span>
            <span className="sm-cell">{person.role}</span>
            <span>{statusBadge(person.status)}</span>
            <span className="sm-cell sm-muted">{lastActiveLabel(person.lastLogin)}</span>
            <Link to={`/dashboard/institution/staff/${person.id}`} className="sm-view">
              View profile <ChevronRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

// Tiny inline icon (avoids adding another lucide import)
function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
