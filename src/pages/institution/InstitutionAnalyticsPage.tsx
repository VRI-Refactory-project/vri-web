import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './InstitutionAnalyticsPage.css';

// --- TYPES ---
interface AnalyticsData {
  metrics: {
    totalSessions: number;
    completedSessions: number;
    avgDuration: number;
    totalUsage: number;
    activeStaff: number;
    totalStaff: number;
  };
  weeklyUsage: { day: string; count: number }[];
  departmentSessions: { name: string; count: number }[];
  outcomes: { label: string; value: number; color: string }[];
  staffUsage: { active: number; usedVri: number; notUsed: number };
  sessionPurpose: { name: string; count: number }[];
}

// --- MOCK API CALL ---
// When your backend is ready, replace the inside of this function with:
// return api<AnalyticsData>('/api/v1/analytics/institution/');
const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    metrics: {
      totalSessions: 186,
      completedSessions: 174,
      avgDuration: 24,
      totalUsage: 74.5,
      activeStaff: 38,
      totalStaff: 42,
    },
    weeklyUsage: [
      { day: 'M', count: 12 },
      { day: 'T', count: 19 },
      { day: 'W', count: 8 },
      { day: 'T', count: 24 },
      { day: 'F', count: 18 },
      { day: 'S', count: 31 },
      { day: 'S', count: 9 },
    ],
    departmentSessions: [
      { name: 'Healthcare', count: 72 },
      { name: 'Reception', count: 46 },
      { name: 'Social Services', count: 40 },
      { name: 'Records', count: 26 },
    ],
    outcomes: [
      { label: 'Completed', value: 94, color: '#10b981' },
      { label: 'Cancelled', value: 4, color: '#ef4444' },
      { label: 'Interrupted', value: 2, color: '#9ca3af' },
    ],
    staffUsage: {
      active: 38,
      usedVri: 31,
      notUsed: 7,
    },
    sessionPurpose: [
      { name: 'Hospital/medical appointment', count: 96 },
      { name: 'Social services', count: 40 },
      { name: 'Front desk / reception', count: 34 },
      { name: 'Other', count: 16 },
    ],
  };
};

export function InstitutionAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="analytics-page">Loading analytics...</div>;
  if (!data) return null;

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand SignConnect usage across your institution.</p>
        </div>
        <button className="btn-export">
          <Download size={16} /> Export report
        </button>
      </header>

      {/* Filters */}
      <div className="analytics-filters">
        <select className="filter-select"><option>Last 7 days</option></select>
        <select className="filter-select"><option>All departments</option></select>
      </div>

      {/* Top 5 Metrics Cards */}
      <section className="analytics-metrics">
        <div className="metric-card">
          <span className="metric-label">TOTAL SESSIONS</span>
          <span className="metric-value">{data.metrics.totalSessions}</span>
          <span className="metric-sub text-success">+12% vs last period</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">COMPLETED SESSIONS</span>
          <span className="metric-value">{data.metrics.completedSessions}</span>
          <span className="metric-sub text-muted">{Math.round((data.metrics.completedSessions / data.metrics.totalSessions) * 100)}% completion rate</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">AVG. SESSION DURATION</span>
          <span className="metric-value">{data.metrics.avgDuration} min</span>
          <span className="metric-sub text-muted">Per completed session</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">TOTAL USAGE</span>
          <span className="metric-value">{data.metrics.totalUsage}h</span>
          <span className="metric-sub text-muted">{Math.round((data.metrics.totalUsage / (data.metrics.totalStaff * 40)) * 100)}% under plan</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">ACTIVE STAFF</span>
          <span className="metric-value">{data.metrics.activeStaff}</span>
          <span className="metric-sub text-muted">of {data.metrics.totalStaff} total staff</span>
        </div>
      </section>

      {/* Sessions Over Time Chart */}
      <section className="analytics-chart-card">
        <div className="chart-header">
          <div>
            <h2>Sessions over time</h2>
            <p>Last 7 days · {data.metrics.totalSessions} sessions total</p>
          </div>
          <div className="chart-toggles">
            <button className="active">Daily</button>
            <button>Weekly</button>
            <button>Monthly</button>
          </div>
        </div>
        
        <div className="bar-chart-container">
          {data.weeklyUsage.map((item, i) => (
            <div key={i} className="bar-column">
              <div className="bar-value">{item.count}</div>
              {/* Calculating height: (count / max_count) * 100% */}
              <div className="bar" style={{ height: `${(item.count / 35) * 100}%` }}></div>
              <div className="bar-label">{item.day}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two Column Layout for Depts & Outcomes */}
      <div className="analytics-split-layout">
        <section className="analytics-list-card">
          <h2>Sessions by department</h2>
          <div className="progress-list">
            {data.departmentSessions.map((dept, i) => (
              <div key={i} className="progress-item">
                <span className="progress-label">{dept.name}</span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${(dept.count / 80) * 100}%` }}></div>
                </div>
                <span className="progress-value">{dept.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-list-card">
          <h2>Session outcomes</h2>
          <div className="outcomes-list">
             {data.outcomes.map((out, i) => (
              <div key={i} className="outcome-item">
                <div className="outcome-dot" style={{ backgroundColor: out.color }}></div>
                <span className="outcome-label">{out.label}</span>
                <div className="outcome-progress-wrap">
                   <div className="outcome-bar" style={{ backgroundColor: out.color, width: `${out.value}%` }}></div>
                </div>
                <span className="outcome-value">{out.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Staff Usage */}
      <section className="analytics-metrics staff-usage">
        <div className="metric-card">
          <span className="metric-value">{data.staffUsage.active}</span>
          <span className="metric-sub text-muted">Active staff</span>
        </div>
        <div className="metric-card bordered">
          <span className="metric-value text-success">{data.staffUsage.usedVri}</span>
          <span className="metric-sub text-muted">Used VRI this period</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{data.staffUsage.notUsed}</span>
          <span className="metric-sub text-muted">Have not used VRI</span>
        </div>
      </section>

      {/* Session Purpose */}
      <section className="analytics-list-card">
        <h2>Session purpose</h2>
        <p className="subtitle">Reasons recorded when the session was started</p>
        <div className="progress-list purpose-list">
          {data.sessionPurpose.map((purpose, i) => (
            <div key={i} className="progress-item">
              <span className="progress-label">{purpose.name}</span>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${(purpose.count / 100) * 100}%` }}></div>
              </div>
              <span className="progress-value">{purpose.count}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}