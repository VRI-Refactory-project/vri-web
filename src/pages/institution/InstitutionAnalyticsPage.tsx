// import { Download } from 'lucide-react';
// import './InstitutionAnalyticsPage.css';

// // 1. Define the structure of the data we will eventually get from the backend
// interface AnalyticsData {
//   metrics: {
//     totalSessions: number;
//     completedSessions: number;
//     avgDuration: number;
//     totalUsage: number;
//     activeStaff: number;
//     totalStaff: number;
//   };
//   weeklyUsage: { day: string; count: number }[];
//   departmentSessions: { name: string; count: number }[];
//   outcomes: { label: string; value: number; color: string }[];
//   staffUsage: { active: number; usedVri: number; notUsed: number };
//   sessionPurpose: { name: string; count: number }[];
// }

// export function InstitutionAnalyticsPage() {
//   // 2. Set the default state to 0s and empty arrays.
//   // When your backend is ready, you will replace this initial state with real data.
//   const data: AnalyticsData = {
//     metrics: {
//       totalSessions: 0,
//       completedSessions: 0,
//       avgDuration: 0,
//       totalUsage: 0,
//       activeStaff: 0,
//       totalStaff: 0,
//     },
//     // Empty arrays for the charts
//     weeklyUsage: [
//       { day: 'M', count: 0 },
//       { day: 'T', count: 0 },
//       { day: 'W', count: 0 },
//       { day: 'T', count: 0 },
//       { day: 'F', count: 0 },
//       { day: 'S', count: 0 },
//       { day: 'S', count: 0 },
//     ],
//     departmentSessions: [],
//     outcomes: [
//       { label: 'Completed', value: 0, color: '#10b981' },
//       { label: 'Cancelled', value: 0, color: '#ef4444' },
//       { label: 'Interrupted', value: 0, color: '#9ca3af' },
//     ],
//     staffUsage: { active: 0, usedVri: 0, notUsed: 0 },
//     sessionPurpose: [],
//   };

//   return (
//     <div className="analytics-page">
//       {/* Header */}
//       <header className="analytics-header">
//         <div>
//           <h1>Analytics</h1>
//           <p>Understand SignConnect usage across your institution.</p>
//         </div>
//         <button className="btn-export">
//           <Download size={16} /> Export report
//         </button>
//       </header>

//       {/* Filters */}
//       <div className="analytics-filters">
//         <select className="filter-select"><option>Last 7 days</option></select>
//         <select className="filter-select"><option>All departments</option></select>
//       </div>

//       {/* Top 5 Metrics Cards */}
//       <section className="analytics-metrics">
//         <div className="metric-card">
//           <span className="metric-label">TOTAL SESSIONS</span>
//           <span className="metric-value">{data.metrics.totalSessions}</span>
//           <span className="metric-sub text-muted">0% vs last period</span>
//         </div>
//         <div className="metric-card">
//           <span className="metric-label">COMPLETED SESSIONS</span>
//           <span className="metric-value">{data.metrics.completedSessions}</span>
//           <span className="metric-sub text-muted">0% completion rate</span>
//         </div>
//         <div className="metric-card">
//           <span className="metric-label">AVG. SESSION DURATION</span>
//           <span className="metric-value">{data.metrics.avgDuration} min</span>
//           <span className="metric-sub text-muted">Per completed session</span>
//         </div>
//         <div className="metric-card">
//           <span className="metric-label">TOTAL USAGE</span>
//           <span className="metric-value">{data.metrics.totalUsage}h</span>
//           <span className="metric-sub text-muted">0% under plan</span>
//         </div>
//         <div className="metric-card">
//           <span className="metric-label">ACTIVE STAFF</span>
//           <span className="metric-value">{data.metrics.activeStaff}</span>
//           <span className="metric-sub text-muted">of {data.metrics.totalStaff} total staff</span>
//         </div>
//       </section>

//       {/* Sessions Over Time Chart */}
//       <section className="analytics-chart-card">
//         <div className="chart-header">
//           <div>
//             <h2>Sessions over time</h2>
//             <p>Last 7 days · {data.metrics.totalSessions} sessions total</p>
//           </div>
//           <div className="chart-toggles">
//             <button className="active">Daily</button>
//             <button>Weekly</button>
//             <button>Monthly</button>
//           </div>
//         </div>

//         <div className="bar-chart-container">
//           {data.weeklyUsage.map((item, i) => (
//             <div key={i} className="bar-column">
//               <div className="bar-value">{item.count}</div>
//               {/* Height will be 0% until there is data */}
//               <div className="bar" style={{ height: `${item.count > 0 ? (item.count / 35) * 100 : 0}%` }}></div>
//               <div className="bar-label">{item.day}</div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Two Column Layout for Depts & Outcomes */}
//       <div className="analytics-split-layout">
//         <section className="analytics-list-card">
//           <h2>Sessions by department</h2>
//           <div className="progress-list">
//              {/* If empty, show a message */}
//             {data.departmentSessions.length === 0 ? (
//               <p className="text-muted" style={{ padding: '16px 0' }}>No data yet.</p>
//             ) : (
//               data.departmentSessions.map((dept, i) => (
//                 <div key={i} className="progress-item">
//                   <span className="progress-label">{dept.name}</span>
//                   <div className="progress-bar-bg">
//                     <div className="progress-bar-fill" style={{ width: `${(dept.count / 80) * 100}%` }}></div>
//                   </div>
//                   <span className="progress-value">{dept.count}</span>
//                 </div>
//               ))
//             )}
//           </div>
//         </section>

//         <section className="analytics-list-card">
//           <h2>Session outcomes</h2>
//           <div className="outcomes-list">
//              {data.outcomes.map((out, i) => (
//               <div key={i} className="outcome-item">
//                 <div className="outcome-dot" style={{ backgroundColor: out.color }}></div>
//                 <span className="outcome-label">{out.label}</span>
//                 <div className="outcome-progress-wrap">
//                    <div className="outcome-bar" style={{ backgroundColor: out.color, width: `${out.value}%` }}></div>
//                 </div>
//                 <span className="outcome-value">{out.value}%</span>
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>

//       {/* Staff Usage */}
//       <section className="analytics-metrics staff-usage">
//         <div className="metric-card">
//           <span className="metric-value">{data.staffUsage.active}</span>
//           <span className="metric-sub text-muted">Active staff</span>
//         </div>
//         <div className="metric-card bordered">
//           <span className="metric-value text-success">{data.staffUsage.usedVri}</span>
//           <span className="metric-sub text-muted">Used VRI this period</span>
//         </div>
//         <div className="metric-card">
//           <span className="metric-value">{data.staffUsage.notUsed}</span>
//           <span className="metric-sub text-muted">Have not used VRI</span>
//         </div>
//       </section>

//       {/* Session Purpose */}
//       <section className="analytics-list-card">
//         <h2>Session purpose</h2>
//         <p className="subtitle">Reasons recorded when the session was started</p>
//         <div className="progress-list purpose-list">
//           {data.sessionPurpose.length === 0 ? (
//              <p className="text-muted" style={{ padding: '16px 0' }}>No data yet.</p>
//           ) : (
//             data.sessionPurpose.map((purpose, i) => (
//               <div key={i} className="progress-item">
//                 <span className="progress-label">{purpose.name}</span>
//                 <div className="progress-bar-bg">
//                   <div className="progress-bar-fill" style={{ width: `${(purpose.count / 100) * 100}%` }}></div>
//                 </div>
//                 <span className="progress-value">{purpose.count}</span>
//               </div>
//             ))
//           )}
//         </div>
//       </section>

//     </div>
//   );
// }

import { useState } from 'react';
import { Download } from 'lucide-react';
import './InstitutionAnalyticsPage.css';

export function InstitutionAnalyticsPage() {
  // 1. State to make the buttons interactive
  const [chartFilter, setChartFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

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
