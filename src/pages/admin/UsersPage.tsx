import { useEffect, useState } from 'react';
import { Download, Search, Pencil, Check, Trash2, XCircle } from 'lucide-react';
import {
  fetchAllAdminUsers,
  fetchAdminUsersPage,
  approveUser,
  deactivateUser,
  deleteUser,
  updateUser,
  type AdminUser,
  type AdminUserFilters,
} from '../../services/adminUsers';
import { describeError } from '../../services/api';
import { TablePagination } from '../../components/TablePagination';
import './AdminDashboardPage.css';
import './UsersPage.css';

const PAGE_SIZE = 10;

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all-types');
  const [status, setStatus] = useState('all-statuses');
  const [range, setRange] = useState('all-time');
  const [page, setPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageCount = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = users ?? [];

  // Modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'delete';
    user: AdminUser;
  } | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const filters: AdminUserFilters = { search, type, status, range };

    const fetchData = () => {
      setError('');
      setUsers(null);

      fetchAdminUsersPage(filters, currentPage, PAGE_SIZE)
        .then((data) => {
          if (!cancelled) {
            setUsers(data.results);
            setTotalUsers(data.total);
            setSelectedIds(new Set());
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(describeError(err));
            setUsers([]);
            setTotalUsers(0);
          }
        });
    };

    // Only debounce when the user is typing
    const isSearching = search.trim().length > 0;
    const timeoutId = setTimeout(fetchData, isSearching ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, type, status, range, currentPage]);

  const refreshUsers = async () => {
    try {
      const data = await fetchAdminUsersPage(
        { search, type, status, range },
        currentPage,
        PAGE_SIZE,
      );
      setUsers(data.results);
      setTotalUsers(data.total);
      setSelectedIds(new Set());
    } catch (err) {
      setError(`Failed to refresh: ${describeError(err)}`);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'verified') return { background: '#dcfce7', color: '#15803d' };
    if (s === 'pending') return { background: '#fef3c7', color: '#b45309' };
    if (s === 'rejected' || s === 'suspended') return { background: '#fee2e2', color: '#b91c1c' };
    return { background: '#f1f5f9', color: '#475569' };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportUsers = await fetchAllAdminUsers({ search, type, status, range });
      if (exportUsers.length === 0) {
        setError('There are no users to export for these filters.');
        return;
      }

      const headers = ['Name', 'Role', 'Verification Status', 'Email', 'Phone', 'Registered At'];
      const rows = exportUsers.map((u) => [
        `"${u.name}"`,
        `"${u.role}"`,
        `"${u.verificationStatus}"`,
        `"${u.email}"`,
        `"${u.phone || ''}"`,
        `"${formatDate(u.registeredAt)}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `signconnect_users_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(`Failed to export users: ${describeError(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!visibleUsers.length) return;
    const allVisibleSelected = visibleUsers.every((user) => selectedIds.has(user.id));
    if (allVisibleSelected) {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        visibleUsers.forEach((user) => next.delete(user.id));
        return next;
      });
    } else {
      setSelectedIds((previous) => new Set([...previous, ...visibleUsers.map((user) => user.id)]));
    }
  };

  const allSelected =
    visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.has(user.id));

  // Action handlers
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await updateUser(editingUser.id, editForm);
      await refreshUsers();
      setEditingUser(null);
    } catch (err) {
      setError(`Failed to save: ${describeError(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (user: AdminUser) => {
    try {
      await approveUser(user.id);
      await refreshUsers();
    } catch (err) {
      setError(`Failed to approve: ${describeError(err)}`);
    }
  };

  const handleDeactivate = (user: AdminUser) => {
    setConfirmAction({ type: 'deactivate', user });
  };

  const handleDelete = (user: AdminUser) => {
    setConfirmAction({ type: 'delete', user });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;

    try {
      if (type === 'deactivate') {
        await deactivateUser(user.id);
        await refreshUsers();
      } else {
        await deleteUser(user.id);
        setUsers((prev) => (prev ? prev.filter((u) => u.id !== user.id) : prev));
        setTotalUsers((count) => Math.max(0, count - 1));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      }
      setConfirmAction(null);
    } catch (err) {
      setError(`Failed to ${type} ${user.name}: ${describeError(err)}`);
      setConfirmAction(null);
    }
  };

  const loading = users === null;
  const isEmpty = !loading && totalUsers === 0;

  return (
    <div className="ad-page users-management-page" style={{ width: '100%', maxWidth: '100%' }}>
      <header className="ad-title">
        <h1>User management</h1>
        <p>Manage and review users in SignConnect</p>
      </header>

      <div
        className="users-header-actions"
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '-60px',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          className="users-btn users-btn--ghost"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          <Download size={15} />
          {isExporting ? 'Exporting…' : 'Export users'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {error}
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <section className="ad-toolbar">
        <label className="users-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search users by name, email or phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <select
          className="users-select"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all-types">All types</option>
          <option value="deaf">DHH User</option>
          <option value="interpreter">Interpreter</option>
          <option value="institution">Institution</option>
          <option value="admin">Admin</option>
        </select>

        <select
          className="users-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all-statuses">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          className="users-select"
          value={range}
          onChange={(e) => {
            setRange(e.target.value);
            setPage(1);
          }}
        >
          <option value="all-time">All time</option>
          <option value="7-days">Last 7 days</option>
          <option value="30-days">Last 30 days</option>
        </select>
      </section>

      <section className="ad-table-card">
        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th className="users-col-check">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={!!allSelected}
                    onChange={toggleSelectAll}
                  />
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
                visibleUsers.map((u) => (
                  <tr key={u.id}>
                    <td data-card-select>
                      <input
                        type="checkbox"
                        aria-label={`Select ${u.name}`}
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                    </td>
                    <td data-card-primary>
                      <strong>{u.name}</strong>
                    </td>
                    <td data-label="Type">{u.role}</td>
                    <td data-label="Verification status">
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          ...statusBadgeStyle(u.verificationStatus),
                        }}
                      >
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td data-label="Email / Phone">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ''}
                    </td>
                    <td data-label="Registered">{formatDate(u.registeredAt)}</td>
                    <td data-label="Last active">{formatDate(u.lastActive)}</td>
                    <td data-card-actions>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(u)}
                          className="users-action-btn users-action-btn--edit"
                          title="Edit user"
                          aria-label={`Edit ${u.name}`}
                        >
                          <Pencil size={14} />
                        </button>

                        {u.verificationStatus === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(u)}
                            className="users-action-btn users-action-btn--approve"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(u)}
                            className="users-action-btn users-action-btn--deactivate"
                          >
                            <XCircle size={14} />
                            Deactivate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="users-action-btn users-action-btn--delete"
                          title="Delete user"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={users?.length ?? 0}
          label="users"
          onPageChange={setPage}
        />
      </section>

      <footer className="users-footer">
        <span>
          Showing {totalUsers} user{totalUsers === 1 ? '' : 's'}
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </span>
      </footer>

      {/* Confirmation Modal (Deactivate/Delete) */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: '18px' }}>
              {confirmAction.type === 'deactivate' ? 'Deactivate User' : 'Delete User'}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to {confirmAction.type}{' '}
              <strong>{confirmAction.user.name}</strong>?{' '}
              {confirmAction.type === 'deactivate'
                ? 'They will not be able to log in.'
                : 'This cannot be undone.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#fff',
                  background: confirmAction.type === 'deactivate' ? '#b45309' : '#ef4444',
                }}
              >
                Yes, {confirmAction.type === 'deactivate' ? 'Deactivate' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: '18px' }}>Edit User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => setEditingUser(null)}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#fff',
                  background: '#382c77',
                }}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
