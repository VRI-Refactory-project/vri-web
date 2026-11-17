
// import { useEffect, useState } from 'react';
// import {
//   Download,
//   Search,
//   SlidersHorizontal,
//   ShieldCheck,
//   Monitor,
//   Landmark,
//   ChevronLeft,
//   ChevronRight,
//   User,
// } from 'lucide-react';
// import { fetchAdminAuditLogs, type AdminAuditLog } from '../../services/adminAuditLogs';
// import { describeError } from '../../services/api';
// import './AdminDashboardPage.css';
// import './AuditLogsPage.css';

// const SOURCES = ['all', 'admin', 'system', 'institution'] as const;
// type SourceFilter = (typeof SOURCES)[number];

// const ITEMS_PER_PAGE = 10; // 👈 Change this if you want more/less per page

// export function AuditLogsPage() {
//   const [logs, setLogs] = useState<AdminAuditLog[] | null>(null);
//   const [error, setError] = useState('');

//   const [searchQuery, setSearchQuery] = useState('');
//   const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
//   const [showFilterMenu, setShowFilterMenu] = useState(false);

//   // 👇 Pagination State
//   const [currentPage, setCurrentPage] = useState(1);

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

//   const filteredLogs =
//     logs?.filter((log) => {
//       const query = searchQuery.toLowerCase();
//       const matchesSearch =
//         log.action.toLowerCase().includes(query) ||
//         log.meta.toLowerCase().includes(query) ||
//         log.source.toLowerCase().includes(query);

//       const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;

//       return matchesSearch && matchesSource;
//     }) || [];

//   // 👇 Pagination Logic
//   const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
//   const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
//   const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
//   const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

//   const isEmpty = !loading && filteredLogs.length === 0;

//   const handleExport = () => {
//     if (!filteredLogs || filteredLogs.length === 0) {
//       alert('No activity logs to export.');
//       return;
//     }

//     const headers = ['Action', 'Details', 'Source'];
//     const rows = filteredLogs.map((log) => [`"${log.action}"`, `"${log.meta}"`, `"${log.source}"`]);

//     const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute(
//       'download',
//       `signconnect_audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
//     );
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

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
//         <button type="button" className="audit-btn audit-btn--ghost" onClick={handleExport}>
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

//         <div className="audit-toolbar" style={{ position: 'relative' }}>
//           <label className="audit-search">
//             <Search size={16} />
//             <input
//               type="search"
//               placeholder="Search activity"
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1); // 👈 Reset to page 1 here
//               }}
//             />
//           </label>

//           <div style={{ position: 'relative' }}>
//             <button
//               type="button"
//               className="audit-btn audit-btn--ghost"
//               onClick={() => setShowFilterMenu(!showFilterMenu)}
//             >
//               <SlidersHorizontal size={15} />
//               Filter {sourceFilter !== 'all' && `(${sourceFilter})`}
//             </button>

//             {showFilterMenu && (
//               <div
//                 style={{
//                   position: 'absolute',
//                   top: '100%',
//                   right: 0,
//                   marginTop: '8px',
//                   background: '#fff',
//                   border: '1px solid #e4e7f2',
//                   borderRadius: '8px',
//                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//                   padding: '8px',
//                   zIndex: 10,
//                   minWidth: '150px',
//                 }}
//               >
//                 {SOURCES.map((src) => (
//                   <button
//                     key={src}
//                     onClick={() => {
//                       setSourceFilter(src);
//                       setCurrentPage(1); // 👈 Reset to page 1 here
//                       setShowFilterMenu(false);
//                     }}
//                     style={{
//                       display: 'block',
//                       width: '100%',
//                       textAlign: 'left',
//                       padding: '8px 12px',
//                       background: sourceFilter === src ? '#f1f5f9' : 'transparent',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: 'pointer',
//                       fontSize: '13px',
//                       textTransform: 'capitalize',
//                     }}
//                   >
//                     {src === 'all' ? 'All Sources' : src}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
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
//               {error ? `Could not load activity: ${error}` : 'No activity matches your filters.'}
//             </p>
//           ) : (
//             // 👇 Render only the current page's logs
//             currentLogs.map((row) => (
//               <div className="audit-row" key={row.id}>
//                 <div className="audit-row__info">
//                   <div className={`audit-icon audit-icon--${row.source}`}>
//                     {row.source === 'admin' && <ShieldCheck size={18} />}
//                     {row.source === 'system' && <Monitor size={18} />}
//                     {row.source === 'institution' && <Landmark size={18} />}
//                     {row.source === 'user' && <User size={18} />}
//                   </div>

//                   <div className="audit-row__text">
//                     <strong>{row.action}</strong>
//                     <small>{row.meta}</small>
//                   </div>
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

//         {/* 👇 Pagination Footer */}
//         {!loading && !isEmpty && (
//           <div className="audit-pagination">
//             <span className="audit-pagination__info">
//               Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredLogs.length)} of{' '}
//               {filteredLogs.length}
//             </span>

//             <div className="audit-pagination__controls">
//               <button
//                 type="button"
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 className="audit-page-btn"
//                 aria-label="Previous page"
//               >
//                 <ChevronLeft size={16} />
//               </button>

//               <span className="audit-page-current">
//                 Page {currentPage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 className="audit-page-btn"
//                 aria-label="Next page"
//               >
//                 <ChevronRight size={16} />
//               </button>
//             </div>
//           </div>
//         )}
//       </section>
//     </main>
//   );
// }


import { useEffect, useState } from 'react';
import {
  Download,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Monitor,
  Landmark,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { fetchAdminAuditLogs, type AdminAuditLog } from '../../services/adminAuditLogs';
import { describeError } from '../../services/api';
import './AdminDashboardPage.css';
import './AuditLogsPage.css';

const SOURCES = ['all', 'admin', 'system', 'institution'] as const;
type SourceFilter = (typeof SOURCES)[number];

const ITEMS_PER_PAGE = 10;

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[] | null>(null);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  // 👇 State to hold the clicked log for the modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

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

  const filteredLogs =
    logs?.filter((log) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(query) ||
        log.meta.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query);

      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;

      return matchesSearch && matchesSource;
    }) || [];

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const isEmpty = !loading && filteredLogs.length === 0;

  const handleExport = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert('No activity logs to export.');
      return;
    }

    const headers = ['Action', 'Details', 'Source'];
    const rows = filteredLogs.map((log) => [`"${log.action}"`, `"${log.meta}"`, `"${log.source}"`]);

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

        <div className="audit-toolbar" style={{ position: 'relative' }}>
          <label className="audit-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search activity"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="audit-btn audit-btn--ghost"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <SlidersHorizontal size={15} />
              Filter {sourceFilter !== 'all' && `(${sourceFilter})`}
            </button>

            {showFilterMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#fff',
                  border: '1px solid #e4e7f2',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '8px',
                  zIndex: 10,
                  minWidth: '150px',
                }}
              >
                {SOURCES.map((src) => (
                  <button
                    key={src}
                    onClick={() => {
                      setSourceFilter(src);
                      setCurrentPage(1);
                      setShowFilterMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: sourceFilter === src ? '#f1f5f9' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {src === 'all' ? 'All Sources' : src}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              {error ? `Could not load activity: ${error}` : 'No activity matches your filters.'}
            </p>
          ) : (
            currentLogs.map((row) => (
              // 👇 Make the row clickable
              <div
                className="audit-row"
                key={row.id}
                onClick={() => setSelectedLog(row)}
                style={{ cursor: 'pointer' }}
              >
                <div className="audit-row__info">
                  <div className={`audit-icon audit-icon--${row.source}`}>
                    {row.source === 'admin' && <ShieldCheck size={18} />}
                    {row.source === 'system' && <Monitor size={18} />}
                    {row.source === 'institution' && <Landmark size={18} />}
                  </div>

                  <div className="audit-row__text">
                    <strong>{row.action}</strong>
                    <small>{row.meta}</small>
                  </div>
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

        {!loading && !isEmpty && (
          <div className="audit-pagination">
            <span className="audit-pagination__info">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredLogs.length)} of{' '}
              {filteredLogs.length}
            </span>

            <div className="audit-pagination__controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="audit-page-btn"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="audit-page-current">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="audit-page-btn"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 👇 THE MODAL */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 22, 58, 0.5)', // Purple-ish overlay
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedLog(null)} // Click outside to close
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '16px',
              boxShadow: '0 24px 80px rgba(25, 20, 60, 0.25)',
              padding: '24px',
              margin: '20px',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`audit-icon audit-icon--${selectedLog.source}`}>
                  {selectedLog.source === 'admin' && <ShieldCheck size={20} />}
                  {selectedLog.source === 'system' && <Monitor size={20} />}
                  {selectedLog.source === 'institution' && <Landmark size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#211d42', fontSize: '18px' }}>{selectedLog.action}</h3>
                  <span style={{ fontSize: '12px', color: '#6f7696' }}>ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Details</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', lineHeight: 1.6 }}>{selectedLog.meta}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '10px 20px',
                  background: '#382c77',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}