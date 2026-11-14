import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { apiBlob, describeError } from '../../services/api';
import './InstitutionAnalyticsPage.css';

export function InstitutionAnalyticsPage() {
  // 1. State to make the buttons interactive
  const [chartFilter, setChartFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const pdfBlob = await apiBlob('/api/v1/dashboard/institution/export/');

      // Create a temporary URL for the PDF.
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // Create a temporary download link.
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'institution-analytics-report.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the temporary URL after the download starts.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      setExportError(describeError(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand SignConnect usage across your institution.</p>
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

        {exportError && (
          <p role="alert" className="text-error">
            {exportError}
          </p>
        )}
      </header>

      {/* Filters */}
      <div className="analytics-filters">
        <select className="filter-select">
          <option>Last 7 days</option>
        </select>
        <select className="filter-select">
          <option>All departments</option>
        </select>
      </div>

      {/* Top 5 Metrics Cards */}
      <section className="analytics-metrics">
        <div className="metric-card">
          <span className="metric-label">TOTAL SESSIONS</span>
          <span className="metric-value">0</span>
          <span className="metric-sub text-muted">0% vs last period</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">COMPLETED SESSIONS</span>
          <span className="metric-value">0</span>
          <span className="metric-sub text-muted">0% completion rate</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">AVG. SESSION DURATION</span>
          <span className="metric-value">0 min</span>
          <span className="metric-sub text-muted">Per completed session</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">TOTAL USAGE</span>
          <span className="metric-value">0h</span>
          <span className="metric-sub text-muted">0% under plan</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">ACTIVE STAFF</span>
          <span className="metric-value">0</span>
          <span className="metric-sub text-muted">of 0 total staff</span>
        </div>
      </section>

      {/* Sessions Over Time Chart */}
      <section className="analytics-chart-card">
        <div className="chart-header">
          <div>
            <h2>Sessions over time</h2>
            <p>Last 7 days · 0 sessions total</p>
          </div>

          {/* 2. Interactive Toggle Buttons */}
          <div className="chart-toggles">
            <button
              className={chartFilter === 'Daily' ? 'active' : ''}
              onClick={() => setChartFilter('Daily')}
            >
              Daily
            </button>
            <button
              className={chartFilter === 'Weekly' ? 'active' : ''}
              onClick={() => setChartFilter('Weekly')}
            >
              Weekly
            </button>
            <button
              className={chartFilter === 'Monthly' ? 'active' : ''}
              onClick={() => setChartFilter('Monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* 3. Empty Bar Chart Layout */}
        <div className="bar-chart-container">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="bar-column">
              <div className="bar-value">0</div>
              <div className="bar" style={{ height: '0%' }}></div>
              <div className="bar-label">{day}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two Column Layout for Depts & Outcomes */}
      <div className="analytics-split-layout">
        <section className="analytics-list-card">
          <h2>Sessions by department</h2>
          <div className="progress-list">
            <p className="text-muted" style={{ padding: '16px 0' }}>
              No data yet.
            </p>
          </div>
        </section>

        <section className="analytics-list-card">
          <h2>Session outcomes</h2>
          <div className="outcomes-list">
            <p className="text-muted" style={{ padding: '16px 0' }}>
              No data yet.
            </p>
          </div>
        </section>
      </div>

      {/* Staff Usage */}
      <section
        className="analytics-metrics staff-usage"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        <div className="metric-card">
          <span className="metric-value">0</span>
          <span className="metric-sub text-muted">Active staff</span>
        </div>
        <div className="metric-card bordered">
          <span className="metric-value text-success">0</span>
          <span className="metric-sub text-muted">Used VRI this period</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">0</span>
          <span className="metric-sub text-muted">Have not used VRI</span>
        </div>
      </section>

      {/* Session Purpose */}
      <section className="analytics-list-card">
        <h2>Session purpose</h2>
        <p className="subtitle">Reasons recorded when the session was started</p>
        <div className="progress-list purpose-list">
          <p className="text-muted" style={{ padding: '16px 0' }}>
            No data yet.
          </p>
        </div>
      </section>
    </div>
  );
}
