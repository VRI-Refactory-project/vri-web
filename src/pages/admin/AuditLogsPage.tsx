// // src/pages/admin/AuditLogsPage.tsx
// import { useEffect, useState } from 'react';
// import { Download, Search, SlidersHorizontal } from 'lucide-react';
// import { fetchAdminAuditLogs, type AdminAuditLog } from '../../services/adminAuditLogs';
// import { describeError } from '../../services/api';
// import './AdminDashboardPage.css';
// import './AuditLogsPage.css';

// export function AuditLogsPage() {
//   const [logs, setLogs] = useState<AdminAuditLog[] | null>(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     let cancelled = false;
//     fetchAdminAuditLogs()
//       .then((data) => {
//         if (!cancelled) setLogs(data);
//       })
//       .catch((err) => {
//         if (!cancelled) {
//           setError(describeError(err));
//           setLogs([]);
//         }
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const loading = logs === null;
//   const isEmpty = !loading && logs.length === 0;

//   return (
//     <main className="ad-page" style={{ width: '100%', maxWidth: '100%' }}>
//       <header
//         className="ad-title"
//         style={{
//           display: 'flex',
//           alignItems: 'flex-start',
//           justifyContent: 'space-between',
//           gap: '16px',
//         }}
//       >
//         <div>
//           <h1>Audit logs</h1>
//           <p>Review secure records of administrative and system activity</p>
//         </div>
//         {/* 👇 Using your existing class here */}
//         <button type="button" className="audit-btn audit-btn--ghost">
//           <Download size={15} />
//           Export logs
//         </button>
//       </header>

//       <section className="audit-panel">
//         <header className="audit-panel__head">
//           <div>
//             <h2>Platform activity</h2>
//             <p>Secure record of account and system actions</p>
//           </div>
//         </header>

//         <div className="audit-toolbar">
//           <label className="audit-search">
//             <Search size={16} />
//             <input type="search" placeholder="Search activity" />
//           </label>
//           {/* 👇 Using your existing class here */}
//           <button type="button" className="audit-btn audit-btn--ghost">
//             <SlidersHorizontal size={15} />
//             Filter
//           </button>
//         </div>

//         <div className="audit-list">
//           <div className="audit-list__head">
//             <span>ACTION</span>
//             <span>SOURCE</span>
//           </div>

//           {loading ? (
//             <p className="audit-empty">Loading activity…</p>
//           ) : isEmpty ? (
//             <p className="audit-empty">
//               {error ? `Could not load activity: ${error}` : 'No activity to show yet.'}
//             </p>
//           ) : (
//             logs.map((row) => (
//               <div className="audit-row" key={row.id}>
//                 <div className="audit-row__info">
//                   <strong>{row.action}</strong>
//                   <small>{row.meta}</small>
//                 </div>
//                 <span className={`audit-badge audit-badge--${row.source}`}>
//                   {row.source.charAt(0).toUpperCase() + row.source.slice(1)}
//                 </span>
//                 <span className="audit-row__arrow" aria-hidden="true">
//                   ›
//                 </span>
//               </div>
//             ))
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }

// src/pages/admin/AuditLogsPage.tsx
import { useEffect, useState } from 'react';
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import { fetchAdminAuditLogs, type AdminAuditLog } from '../../services/adminAuditLogs';
import { describeError } from '../../services/api';
import './AdminDashboardPage.css';
import './AuditLogsPage.css';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAdminAuditLogs()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(describeError(err));
          setLogs([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = logs === null;
  const isEmpty = !loading && logs.length === 0;

  // 👇 ADD THIS FUNCTION TO HANDLE THE EXPORT
  const handleExport = () => {
    if (!logs || logs.length === 0) {
      alert('No activity logs to export.');
      return;
    }

    const headers = ['Action', 'Details', 'Source'];
    const rows = logs.map((log) => [`"${log.action}"`, `"${log.meta}"`, `"${log.source}"`]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `signconnect_audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="ad-page" style={{ width: '100%', maxWidth: '100%' }}>
      <header
        className="ad-title"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h1>Audit logs</h1>
          <p>Review secure records of administrative and system activity</p>
        </div>
        {/* 👇 ADDED onClick={handleExport} HERE */}
        <button type="button" className="audit-btn audit-btn--ghost" onClick={handleExport}>
          <Download size={15} />
          Export logs
        </button>
      </header>

      <section className="audit-panel">
        <header className="audit-panel__head">
          <div>
            <h2>Platform activity</h2>
            <p>Secure record of account and system actions</p>
          </div>
        </header>

        <div className="audit-toolbar">
          <label className="audit-search">
            <Search size={16} />
            <input type="search" placeholder="Search activity" />
          </label>
          <button type="button" className="audit-btn audit-btn--ghost">
            <SlidersHorizontal size={15} />
            Filter
          </button>
        </div>

        <div className="audit-list">
          <div className="audit-list__head">
            <span>ACTION</span>
            <span>SOURCE</span>
          </div>

          {loading ? (
            <p className="audit-empty">Loading activity…</p>
          ) : isEmpty ? (
            <p className="audit-empty">
              {error ? `Could not load activity: ${error}` : 'No activity to show yet.'}
            </p>
          ) : (
            logs.map((row) => (
              <div className="audit-row" key={row.id}>
                <div className="audit-row__info">
                  <strong>{row.action}</strong>
                  <small>{row.meta}</small>
                </div>
                <span className={`audit-badge audit-badge--${row.source}`}>
                  {row.source.charAt(0).toUpperCase() + row.source.slice(1)}
                </span>
                <span className="audit-row__arrow" aria-hidden="true">
                  ›
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
