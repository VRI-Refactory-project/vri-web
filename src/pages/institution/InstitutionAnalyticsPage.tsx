import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { apiBlob, describeError } from '../../services/api';
import {
  getInstitutionDashboardData,
  type InstitutionDashboardData,
} from '../../services/institutionDashboard';
import './InstitutionAnalyticsPage.css';

export function InstitutionAnalyticsPage() {
  const [chartFilter, setChartFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  const [dashboardData, setDashboardData] = useState<InstitutionDashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load institution dashboard data from the backend.
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setDashboardError(null);

        const data = await getInstitutionDashboardData();
        setDashboardData(data);
      } catch (error) {
        setDashboardError(describeError(error));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  // Export institution analytics as a PDF.
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const pdfBlob = await apiBlob('/api/v1/dashboard/institution/export/');

      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'institution-analytics-report.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      setExportError(describeError(error));
    } finally {
      setIsExporting(false);
    }
  };

  const sessions = dashboardData?.sessions;
  const staff = dashboardData?.staff;

  const averageDuration =
    sessions?.averageCallDurationSeconds !== undefined
      ? `${(sessions.averageCallDurationSeconds / 60).toFixed(1)} min`
      : '—';

  const completionRate =
    sessions && sessions.totalRequests > 0
      ? `${((sessions.completedRequests / sessions.totalRequests) * 100).toFixed(
          1,
        )}% completion rate`
      : 'No requests recorded';

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand SignConnect usage across your institution.</p>

          {dashboardData && <p className="text-muted">{dashboardData.institutionName}</p>}
        </div>

        <button className="btn-export" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating report...
            </>
          ) : (
            <>
              <Download size={16} />
              Export report
            </>
          )}
        </button>
      </header>

      {/* Error messages */}
      {dashboardError && (
        <p role="alert" className="text-error">
          Unable to load institution analytics: {dashboardError}
        </p>
      )}

      {exportError && (
        <p role="alert" className="text-error">
          Unable to export report: {exportError}
        </p>
      )}

      {/* Filters */}
      <div className="analytics-filters">
        <select className="filter-select" disabled>
          <option>All available data</option>
        </select>

        <select className="filter-select" disabled>
          <option>All departments</option>
        </select>
      </div>

      {/* Main Analytics Metrics */}
      <section className="analytics-metrics">
        <div className="metric-card">
          <span className="metric-label">TOTAL VIDEO SESSIONS</span>

          <span className="metric-value">
            {isLoading ? '...' : (sessions?.totalVideoSessions ?? '—')}
          </span>

          <span className="metric-sub text-muted">All recorded video sessions</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">COMPLETED REQUESTS</span>

          <span className="metric-value">
            {isLoading ? '...' : (sessions?.completedRequests ?? '—')}
          </span>

          <span className="metric-sub text-muted">{isLoading ? 'Loading...' : completionRate}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">AVG. SESSION DURATION</span>

          <span className="metric-value">{isLoading ? '...' : averageDuration}</span>

          <span className="metric-sub text-muted">Per completed video call</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">PENDING REQUESTS</span>

          <span className="metric-value">
            {isLoading ? '...' : (sessions?.pendingRequests ?? '—')}
          </span>

          <span className="metric-sub text-muted">Requests awaiting completion</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">ACTIVE STAFF</span>

          <span className="metric-value">{isLoading ? '...' : (staff?.active ?? '—')}</span>

          <span className="metric-sub text-muted">Of {staff?.total ?? '—'} total staff</span>
        </div>
      </section>

      {/* Sessions Over Time */}
      <section className="analytics-chart-card">
        <div className="chart-header">
          <div>
            <h2>Sessions over time</h2>
            <p>Time-based session statistics are not yet available from the backend.</p>
          </div>

          <div className="chart-toggles">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((filter) => (
              <button
                key={filter}
                className={chartFilter === filter ? 'active' : ''}
                onClick={() => setChartFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="bar-chart-container">
          <p className="text-muted">
            Session history will appear here once the backend provides date-based analytics.
          </p>
        </div>
      </section>

      {/* Department and Session Outcomes */}
      <div className="analytics-split-layout">
        <section className="analytics-list-card">
          <h2>Sessions by department</h2>

          <div className="progress-list">
            <p className="text-muted" style={{ padding: '16px 0' }}>
              Department-level session data is not currently provided by the backend.
            </p>
          </div>
        </section>

        <section className="analytics-list-card">
          <h2>Session outcomes</h2>

          <div className="outcomes-list">
            {isLoading ? (
              <p className="text-muted">Loading session outcomes...</p>
            ) : sessions ? (
              <>
                <div className="outcome-item">
                  <span>Completed requests</span>
                  <strong>{sessions.completedRequests}</strong>
                </div>

                <div className="outcome-item">
                  <span>Pending requests</span>
                  <strong>{sessions.pendingRequests}</strong>
                </div>

                <div className="outcome-item">
                  <span>Cancelled requests</span>
                  <strong>{sessions.cancelledRequests}</strong>
                </div>

                <div className="outcome-item">
                  <span>Failed requests</span>
                  <strong>{sessions.failedRequests}</strong>
                </div>
              </>
            ) : (
              <p className="text-muted">Session outcome data is unavailable.</p>
            )}
          </div>
        </section>
      </div>

      {/* Staff Summary */}
      <section
        className="analytics-metrics staff-usage"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        <div className="metric-card">
          <span className="metric-value">{isLoading ? '...' : (staff?.total ?? '—')}</span>

          <span className="metric-sub text-muted">Total staff</span>
        </div>

        <div className="metric-card bordered">
          <span className="metric-value text-success">
            {isLoading ? '...' : (staff?.active ?? '—')}
          </span>

          <span className="metric-sub text-muted">Active staff</span>
        </div>

        <div className="metric-card">
          <span className="metric-value">{isLoading ? '...' : (staff?.revoked ?? '—')}</span>

          <span className="metric-sub text-muted">Revoked staff</span>
        </div>
      </section>

      {/* Session Purpose */}
      <section className="analytics-list-card">
        <h2>Session purpose</h2>

        <p className="subtitle">Reasons recorded when the session was started</p>

        <div className="progress-list purpose-list">
          <p className="text-muted" style={{ padding: '16px 0' }}>
            Session purpose data is not currently included in the institution dashboard API
            response.
          </p>
        </div>
      </section>
    </div>
  );
}
