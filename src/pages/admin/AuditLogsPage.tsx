// src/pages/admin/AuditLogsPage.tsx
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import './AuditLogsPage.css';

type AuditSource = 'Admin' | 'System' | 'Institution';

interface AuditRow {
  id: string;
  action: string;
  meta: string;
  source: AuditSource;
}

// Static sample — will come from the API in a follow-up.
const LOGS: AuditRow[] = [
  {
    id: 'approved-interpreter',
    action: 'Approved interpreter',
    meta: '06:31 Alex Steven. Daniel Njovu. 192.0.2.4',
    source: 'Admin',
  },
  {
    id: 'session-ended',
    action: 'Session ended',
    meta: '06:18. System. SC-90211. Automated',
    source: 'System',
  },
  {
    id: 'updated-institution',
    action: 'Updated institution settings',
    meta: '05:54. Esther Nalwoga. Mulago hospital. 192.0.2.18',
    source: 'Institution',
  },
  {
    id: 'rejected-verification',
    action: 'Rejected verification',
    meta: '05:22. Alex Steven. Application SC-VI842. 192.0.2.4',
    source: 'Admin',
  },
];

const TODAY_LABEL = 'September 22, 2026';

export function AuditLogsPage() {
  return (
    <div className="audit-page">
      {/* Header */}
      <header className="audit-header">
        <div>
          <h1>Audit logs</h1>
          <p>Review secure records of administrative and system activity</p>
        </div>
        <button type="button" className="audit-btn audit-btn--ghost">
          <Download size={15} />
          Export logs
        </button>
      </header>

      {/* Panel */}
      <section className="audit-panel">
        <header className="audit-panel__head">
          <div>
            <h2>Platform activity</h2>
            <p>Secure record of account and system actions</p>
          </div>
          <span className="audit-date-pill">{TODAY_LABEL}</span>
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

          {LOGS.length === 0 ? (
            <p className="audit-empty">No activity to show yet.</p>
          ) : (
            LOGS.map((row) => (
              <div className="audit-row" key={row.id}>
                <div className="audit-row__info">
                  <strong>{row.action}</strong>
                  <small>{row.meta}</small>
                </div>
                <span className={`audit-badge audit-badge--${row.source.toLowerCase()}`}>
                  {row.source}
                </span>
                <span className="audit-row__arrow" aria-hidden="true">
                  ›
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
