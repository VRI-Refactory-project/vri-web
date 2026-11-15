

// import { useEffect, useState } from 'react';
// import { Download, Search, Pencil, Check, Trash2, XCircle } from 'lucide-react';
// import {
//   fetchAdminUsers,
//   approveUser,
//   deactivateUser,
//   deleteUser,
//   type AdminUser,
//   type AdminUserFilters,
// } from '../../services/adminUsers';
// import { describeError } from '../../services/api';
// import './AdminDashboardPage.css';
// import './UsersPage.css';

// export function UsersPage() {
//   const [users, setUsers] = useState<AdminUser[] | null>(null);
//   const [error, setError] = useState('');

//   // Filter states
//   const [search, setSearch] = useState('');
//   const [type, setType] = useState('all-types');
//   const [status, setStatus] = useState('all-statuses');
//   const [range, setRange] = useState('all-time');

//   // Load users when filters change
//   useEffect(() => {
//     let cancelled = false;
//     const filters: AdminUserFilters = { search, type, status, range };

//     const timeoutId = setTimeout(() => {
//       setError('');

//       fetchAdminUsers(filters)
//         .then((data) => {
//           if (!cancelled) setUsers(data);
//         })
//         .catch((err) => {
//           if (!cancelled) {
//             setError(describeError(err));
//             setUsers([]);
//           }
//         });
//     }, 300);

//     return () => {
//       cancelled = true;
//       clearTimeout(timeoutId);
//     };
//   }, [search, type, status, range]);

//   // 👇 Helper to refresh the current view after an action
//   const refreshUsers = async () => {
//     try {
//       const data = await fetchAdminUsers({ search, type, status, range });
//       setUsers(data);
//     } catch (err) {
//       alert(`Failed to refresh: ${describeError(err)}`);
//     }
//   };

//   // Reusable helper to format a date string nicely
//   const formatDate = (value: string | null | undefined) => {
//     if (!value) return '—';
//     const d = new Date(value);
//     if (isNaN(d.getTime())) return '—';
//     return d.toLocaleDateString('en-GB', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric',
//     });
//   };

//   const handleExport = () => {
//     if (!users || users.length === 0) {
//       alert('No users to export');
//       return;
//     }

//     const headers = ['Name', 'Role', 'Verification Status', 'Email', 'Phone', 'Registered At'];
//     const rows = users.map((u) => [
//       `"${u.name}"`,
//       `"${u.role}"`,
//       `"${u.verificationStatus}"`,
//       `"${u.email}"`,
//       `"${u.phone || ''}"`,
//       `"${formatDate(u.registeredAt)}"`,
//     ]);

//     const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute(
//       'download',
//       `signconnect_users_${new Date().toISOString().split('T')[0]}.csv`,
//     );
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // 👇 Real handlers that call the backend
//   const handleEdit = (user: AdminUser) => {
//     // TODO: Replace with a real edit modal/page later
//     alert(`Edit user: ${user.name} (ID: ${user.id})`);
//   };

//   const handleApprove = async (user: AdminUser) => {
//     try {
//       await approveUser(user.id);
//       await refreshUsers();
//     } catch (err) {
//       alert(`Failed to approve: ${describeError(err)}`);
//     }
//   };

//   const handleDeactivate = async (user: AdminUser) => {
//     if (!window.confirm(`Deactivate ${user.name}? They won't be able to log in.`)) return;
//     try {
//       await deactivateUser(user.id);
//       await refreshUsers();
//     } catch (err) {
//       alert(`Failed to deactivate: ${describeError(err)}`);
//     }
//   };

//   const handleDelete = async (user: AdminUser) => {
//     if (!window.confirm(`Delete ${user.name} permanently? This cannot be undone.`)) return;
//     try {
//       await deleteUser(user.id);
//       // Optimistically remove from list
//       setUsers((prev) => (prev ? prev.filter((u) => u.id !== user.id) : prev));
//     } catch (err) {
//       alert(`Failed to delete: ${describeError(err)}`);
//     }
//   };

//   const loading = users === null;
//   const isEmpty = !loading && users.length === 0;

//   return (
//     <div className="ad-page" style={{ width: '100%', maxWidth: '100%' }}>
//       <header className="ad-title">
//         <h1>User management</h1>
//         <p>Manage and review users in SignConnect</p>
//       </header>

//       <div
//         style={{
//           display: 'flex',
//           gap: '8px',
//           justifyContent: 'flex-end',
//           marginTop: '-60px',
//           marginBottom: '24px',
//         }}
//       >
//         <button type="button" className="users-btn users-btn--ghost" onClick={handleExport}>
//           <Download size={15} />
//           Export users
//         </button>
//       </div>

//       <section className="ad-toolbar">
//         <label className="users-search">
//           <Search size={16} />
//           <input
//             type="search"
//             placeholder="Search users by name, email or phone…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </label>

//         <select className="users-select" value={type} onChange={(e) => setType(e.target.value)}>
//           <option value="all-types">All types</option>
//           <option value="deaf">DHH User</option>
//           <option value="interpreter">Interpreter</option>
//           <option value="institution">Institution</option>
//           <option value="admin">Admin</option>
//         </select>

//         <select className="users-select" value={status} onChange={(e) => setStatus(e.target.value)}>
//           <option value="all-statuses">All statuses</option>
//           <option value="verified">Verified</option>
//           <option value="pending">Pending</option>
//           <option value="rejected">Rejected</option>
//           <option value="suspended">Suspended</option>
//         </select>

//         <select className="users-select" value={range} onChange={(e) => setRange(e.target.value)}>
//           <option value="all-time">All time</option>
//           <option value="7-days">Last 7 days</option>
//           <option value="30-days">Last 30 days</option>
//         </select>
//       </section>

//       <section className="ad-table-card">
//         <table className="users-table">
//           <thead>
//             <tr>
//               <th className="users-col-check">
//                 <input type="checkbox" aria-label="Select all" />
//               </th>
//               <th>User</th>
//               <th>Type</th>
//               <th>Verification status</th>
//               <th>Email / Phone</th>
//               <th>Registered</th>
//               <th>Last active</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={8} className="users-empty">
//                   Loading users…
//                 </td>
//               </tr>
//             ) : isEmpty ? (
//               <tr>
//                 <td colSpan={8} className="users-empty">
//                   {error ? `Could not load users: ${error}` : 'No users to show yet.'}
//                 </td>
//               </tr>
//             ) : (
//               users.map((u) => (
//                 <tr key={u.id}>
//                   <td>
//                     <input type="checkbox" aria-label={`Select ${u.name}`} />
//                   </td>
//                   <td>
//                       <strong>{u.name}</strong>
//                       {/* <small>{u.email}</small> */}
//                   </td>
//                   <td>{u.role}</td>
//                   <td>{u.verificationStatus}</td>
//                   <td>
//                     {u.email}
//                     {u.phone ? ` · ${u.phone}` : ''}
//                   </td>
//                   <td>{formatDate(u.registeredAt)}</td>
//                   <td>{formatDate(u.lastActive)}</td>
//                   <td>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                       <button
//                         type="button"
//                         onClick={() => handleEdit(u)}
//                         className="users-action-btn users-action-btn--edit"
//                       >
//                         <Pencil size={14} />
//                         {/* Edit */}
//                       </button>

//                       {u.verificationStatus === 'pending' ? (
//                         <button
//                           type="button"
//                           onClick={() => handleApprove(u)}
//                           className="users-action-btn users-action-btn--approve"
//                         >
//                           <Check size={14} />
//                           Approve
//                         </button>
//                       ) : (
//                         <button
//                           type="button"
//                           onClick={() => handleDeactivate(u)}
//                           className="users-action-btn users-action-btn--deactivate"
//                         >
//                           <XCircle size={14} />
//                           Deactivate
//                         </button>
//                       )}

//                       <button
//                         type="button"
//                         onClick={() => handleDelete(u)}
//                         className="users-action-btn users-action-btn--delete"
//                         title="Delete user"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </section>

//       <footer className="users-footer">
//         <span>
//           Showing {users?.length ?? 0} user{users?.length === 1 ? '' : 's'}
//         </span>
//       </footer>
//     </div>
//   );
// }


import { useEffect, useState } from 'react';
import { Download, Search, Pencil, Check, Trash2, XCircle } from 'lucide-react';
import {
  fetchAdminUsers,
  approveUser,
  deactivateUser,
  deleteUser,
  type AdminUser,
  type AdminUserFilters,
} from '../../services/adminUsers';
import { describeError } from '../../services/api';
import './AdminDashboardPage.css';
import './UsersPage.css';

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all-types');
  const [status, setStatus] = useState('all-statuses');
  const [range, setRange] = useState('all-time');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const filters: AdminUserFilters = { search, type, status, range };

    const timeoutId = setTimeout(() => {
      setError('');

      fetchAdminUsers(filters)
        .then((data) => {
          if (!cancelled) {
            setUsers(data);
            setSelectedIds(new Set()); // Clear selection on reload
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(describeError(err));
            setUsers([]);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, type, status, range]);

  const refreshUsers = async () => {
    try {
      const data = await fetchAdminUsers({ search, type, status, range });
      setUsers(data);
      setSelectedIds(new Set());
    } catch (err) {
      alert(`Failed to refresh: ${describeError(err)}`);
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

  // NEW: Status pill style helper
  const statusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'verified') return { background: '#dcfce7', color: '#15803d' };
    if (s === 'pending') return { background: '#fef3c7', color: '#b45309' };
    if (s === 'rejected' || s === 'suspended')
      return { background: '#fee2e2', color: '#b91c1c' };
    return { background: '#f1f5f9', color: '#475569' };
  };

  const handleExport = () => {
    if (!users || users.length === 0) {
      alert('No users to export');
      return;
    }

    const headers = ['Name', 'Role', 'Verification Status', 'Email', 'Phone', 'Registered At'];
    const rows = users.map((u) => [
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
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!users) return;
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const allSelected = users && users.length > 0 && selectedIds.size === users.length;

  // Action handlers
  const handleEdit = (user: AdminUser) => {
    alert(`Edit user: ${user.name} (ID: ${user.id})`);
  };

  const handleApprove = async (user: AdminUser) => {
    try {
      await approveUser(user.id);
      await refreshUsers();
    } catch (err) {
      alert(`Failed to approve: ${describeError(err)}`);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (!window.confirm(`Deactivate ${user.name}? They won't be able to log in.`)) return;
    try {
      await deactivateUser(user.id);
      await refreshUsers();
    } catch (err) {
      alert(`Failed to deactivate: ${describeError(err)}`);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.name} permanently? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== user.id) : prev));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    } catch (err) {
      alert(`Failed to delete: ${describeError(err)}`);
    }
  };

  const loading = users === null;
  const isEmpty = !loading && users.length === 0;

  return (
    <div className="ad-page" style={{ width: '100%', maxWidth: '100%' }}>
      <header className="ad-title">
        <h1>User management</h1>
        <p>Manage and review users in SignConnect</p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '-60px',
          marginBottom: '24px',
        }}
      >
        <button type="button" className="users-btn users-btn--ghost" onClick={handleExport}>
          <Download size={15} />
          Export users
        </button>
      </div>

      <section className="ad-toolbar">
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
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>

        <select className="users-select" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="all-time">All time</option>
          <option value="7-days">Last 7 days</option>
          <option value="30-days">Last 30 days</option>
        </select>
      </section>

      <section className="ad-table-card">
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
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${u.name}`}
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    {/* NEW: Status pill */}
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
                  <td>
                    {u.email}
                    {u.phone ? ` · ${u.phone}` : ''}
                  </td>
                  <td>{formatDate(u.registeredAt)}</td>
                  <td>{formatDate(u.lastActive)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="users-action-btn users-action-btn--edit"
                      >
                        <Pencil size={14} />
                        {/* Edit */}
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
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="users-footer">
        <span>
          Showing {users?.length ?? 0} user{users?.length === 1 ? '' : 's'}
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </span>
      </footer>
    </div>
  );
}