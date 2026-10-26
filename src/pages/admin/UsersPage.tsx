// src/pages/admin/UsersPage.tsx
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import './UsersPage.css';

export function UsersPage() {
  return (
    <div className="users-page">
      {/* Header */}
      <header className="users-header">
        <div>
          <h1>User management</h1>
          <p>Manage and review users in SignConnect</p>
        </div>
        <div className="users-header-actions">
          <button type="button" className="users-btn users-btn--ghost">
            <Download size={15} />
            Export users
          </button>
          <button type="button" className="users-btn users-btn--icon" aria-label="More options">
            …
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="users-filters">
        <label className="users-search">
          <Search size={16} />
          <input type="search" placeholder="Search users by name, email or phone…" />
        </label>

        <select className="users-select" defaultValue="all-types">
          <option value="all-types">All types</option>
          <option value="dhh">DHH User</option>
          <option value="interpreter">Interpreter</option>
          <option value="institution">Institution</option>
          <option value="admin">Admin</option>
        </select>

        <select className="users-select" defaultValue="all-statuses">
          <option value="all-statuses">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>

        <select className="users-select" defaultValue="all-time">
          <option value="all-time">All time</option>
          <option value="7-days">Last 7 days</option>
          <option value="30-days">Last 30 days</option>
        </select>

        <button type="button" className="users-btn users-btn--primary">
          <SlidersHorizontal size={15} />
          Filter
        </button>
      </section>

      {/* Table */}
      <section className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th className="users-col-check">
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>User</th>
              <th>Type</th>
              <th>Verification status</th>
              <th>Email / Phone</th>
              <th>Registered</th>
              <th>Last active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="users-empty">
                No users to show yet.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="users-footer">
        <span>Showing 0 users</span>
      </footer>
    </div>
  );
}
