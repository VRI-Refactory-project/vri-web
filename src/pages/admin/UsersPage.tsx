// src/pages/admin/UsersPage.tsx
import { useEffect, useState } from 'react';
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import { fetchAdminUsers, type AdminUser, type AdminUserFilters } from '../../services/adminUsers';
import { describeError } from '../../services/api';
import './UsersPage.css';

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all-types');
  const [status, setStatus] = useState('all-statuses');
  const [range, setRange] = useState('all-time');

  useEffect(() => {
    let cancelled = false;
    fetchAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(describeError(err));
          setUsers([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilter = async () => {
    const filters: AdminUserFilters = { search, type, status, range };
    setUsers(null);
    setError('');
    try {
      const data = await fetchAdminUsers(filters);
      setUsers(data);
    } catch (err) {
      setError(describeError(err));
      setUsers([]);
    }
  };

  const loading = users === null;
  const isEmpty = !loading && users.length === 0;

  return (
    <div className="users-page">
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

      <section className="users-filters">
        <label className="users-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search users by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select className="users-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all-types">All types</option>
          <option value="deaf">DHH User</option>
          <option value="interpreter">Interpreter</option>
          <option value="institution">Institution</option>
          <option value="admin">Admin</option>
        </select>

        <select className="users-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all-statuses">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>

        <select className="users-select" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="all-time">All time</option>
          <option value="7-days">Last 7 days</option>
          <option value="30-days">Last 30 days</option>
        </select>

        <button
          type="button"
          className="users-btn users-btn--primary"
          onClick={() => void handleFilter()}
        >
          <SlidersHorizontal size={15} />
          Filter
        </button>
      </section>

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
            {loading ? (
              <tr>
                <td colSpan={8} className="users-empty">
                  Loading users…
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={8} className="users-empty">
                  {error ? `Could not load users: ${error}` : 'No users to show yet.'}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input type="checkbox" aria-label={`Select ${u.name}`} />
                  </td>
                  <td>
                    <div>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>{u.verificationStatus}</td>
                  <td>
                    {u.email}
                    {u.phone ? ` · ${u.phone}` : ''}
                  </td>
                  <td>{u.registeredAt}</td>
                  <td>{u.lastActive}</td>
                  <td>…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="users-footer">
        <span>
          Showing {users?.length ?? 0} user{users?.length === 1 ? '' : 's'}
        </span>
      </footer>
    </div>
  );
}
