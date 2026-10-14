import { Search, Plus, ChevronDown, ChevronRight, Check, Clock, Minus } from 'lucide-react';
import './StaffManagementPage.css';
import { Link } from 'react-router-dom';

// ── MOCK DATA ─────────────────────────────────────────────
const staffMembers = [
  {
    id: 'sc',
    initials: 'SC',
    name: 'Maggie Nanduga',
    dept: 'Healthcare',
    role: 'Staff',
    status: 'Active',
    lastActive: '5 min ago',
  },
  {
    id: 'mr',
    initials: 'MR',
    name: 'Michael Reed',
    dept: 'Reception',
    role: 'Staff',
    status: 'Active',
    lastActive: '18 min ago',
  },
  {
    id: 'ps',
    initials: 'PS',
    name: 'Priya Shah',
    dept: 'Social Services',
    role: 'Staff',
    status: 'Invitation Sent',
    lastActive: '—',
  },
  {
    id: 'jo',
    initials: 'JO',
    name: 'James Otieno',
    dept: 'IT Support',
    role: 'Staff',
    status: 'Inactive',
    lastActive: '3 days ago',
  },
];

function statusBadge(status: string) {
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
          <strong>42 Staff Members</strong>
          <span>38 active · 3 invitations pending · 1 inactive</span>
        </div>
      </div>

      {/* Filters */}
      <div className="sm-filters">
        <div className="sm-search">
          <Search size={16} />
          <input placeholder="Search staff by name or email" />
        </div>
        <div className="sm-select">
          <span>Department</span>
          <ChevronDown size={14} />
        </div>
        <div className="sm-select">
          <span>Status</span>
          <ChevronDown size={14} />
        </div>
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
        {staffMembers.map((person) => (
          <div key={person.id} className="sm-row">
            <div className="sm-member">
              <span className="sm-avatar">{person.initials}</span>
              <strong>{person.name}</strong>
            </div>
            <span className="sm-cell">{person.dept}</span>
            <span className="sm-cell">{person.role}</span>
            <span>{statusBadge(person.status)}</span>
            <span className="sm-cell sm-muted">{person.lastActive}</span>
            <button className="sm-view">
              View profile <ChevronRight size={16} />
            </button>
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
