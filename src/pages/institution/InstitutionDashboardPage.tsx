import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, CircleUserRound, Info, Plus, UserRound } from 'lucide-react';
import './InstitutionDashboardPage.css';

type SessionStatus = 'Live' | 'Ended' | 'Pending';

interface StaffSession {
  id: string;
  member: string;
  department: string;
  interpreter: string;
  startTime: string;
  duration: string;
  status: SessionStatus;
}

interface Department {
  name: string;
  sessionsToday: number;
  active: number;
}

interface InstitutionDashboardData {
  activeSessions: number;
  staff: number;
  activeStaff: number;
  sessionsThisMonth: number;
  usageHours: number;
  usagePlanPercent: number;
  alerts: number;
  pendingStaff: number;
  flaggedSessions: number;
  weeklyActivity: number[];
  departments: Department[];
  sessions: StaffSession[];
}

const DEMO_DATA: InstitutionDashboardData = {
  activeSessions: 8,
  staff: 42,
  activeStaff: 38,
  sessionsThisMonth: 186,
  usageHours: 74.5,
  usagePlanPercent: 12,
  alerts: 4,
  pendingStaff: 3,
  flaggedSessions: 1,
  weeklyActivity: [48, 66, 41, 77, 59, 88, 68],
  departments: [
    { name: 'Emergency', sessionsToday: 3, active: 1 },
    { name: 'Radiology', sessionsToday: 2, active: 1 },
    { name: 'Outpatient', sessionsToday: 2, active: 0 },
    { name: 'Cardiology', sessionsToday: 1, active: 1 },
  ],
  sessions: [
    {
      id: 'SES-1001',
      member: 'Maria Namono',
      department: 'Emergency',
      interpreter: 'J. Okello',
      startTime: '10:42 AM',
      duration: '12m',
      status: 'Live',
    },
    {
      id: 'SES-1002',
      member: 'David Kintu',
      department: 'Radiology',
      interpreter: 'S. Auma',
      startTime: '10:35 AM',
      duration: '19m',
      status: 'Live',
    },
    {
      id: 'SES-1003',
      member: 'Grace Nakato',
      department: 'Outpatient',
      interpreter: 'P. Ssali',
      startTime: '10:50 AM',
      duration: '4m',
      status: 'Live',
    },
    {
      id: 'SES-1004',
      member: 'Peter Wasswa',
      department: 'Cardiology',
      interpreter: 'R. Namutebi',
      startTime: '10:20 AM',
      duration: '34m',
      status: 'Live',
    },
  ],
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const ALERTS = [
  {
    id: 'flagged-session',
    title: 'Session flagged for review',
    detail: 'Radiology · James Tumusiime',
    time: '2h ago',
    type: 'danger',
    icon: AlertCircle,
    action: 'sessions',
  },
  {
    id: 'pending-accounts',
    title: '3 staff accounts pending activation',
    detail: 'Awaiting institution approval',
    time: '4h ago',
    type: 'info',
    icon: Info,
    action: 'staff',
  },
  {
    id: 'interpreter-unavailable',
    title: 'Interpreter S. Auma marked unavailable',
    detail: 'Back online tomorrow',
    time: 'Yesterday',
    type: 'person',
    icon: UserRound,
    action: 'staff',
  },
  {
    id: 'monthly-usage',
    title: 'Monthly usage at 74.5h',
    detail: '12% under plan this billing period',
    time: 'Today',
    type: 'success',
    icon: Check,
    action: 'analytics',
  },
] as const;

export interface InstitutionDashboardPageProps {
  data?: InstitutionDashboardData;
  onCreateStaff?: () => void;
  onViewSession?: (sessionId: string) => void;
}

export function InstitutionDashboardPage({
  data = DEMO_DATA,
  onCreateStaff,
  onViewSession,
}: InstitutionDashboardPageProps) {
  const navigate = useNavigate();
  const [weekly, setWeekly] = useState(true);
  const [search, setSearch] = useState('');

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.sessions;

    return data.sessions.filter((session) =>
      [session.member, session.department, session.interpreter, session.id].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [data.sessions, search]);

  const goTo = (section: string) => {
    navigate(`/dashboard/institution/${section}`);
  };

  const createStaff = () => {
    if (onCreateStaff) {
      onCreateStaff();
      return;
    }

    goTo('staff');
  };

  const viewSession = (sessionId: string) => {
    if (onViewSession) {
      onViewSession(sessionId);
      return;
    }

    navigate(`/dashboard/institution/sessions?sessionId=${encodeURIComponent(sessionId)}`);
  };

  return (
    <div className="id-page">
      <header className="id-heading">
        <div>
          <h1>Institution dashboard</h1>
          <p>Here’s what’s happening today.</p>
        </div>
      </header>

      <section className="id-kpis" aria-label="Institution overview">
        <article className="id-kpi">
          <span className="id-kpi-label">Active sessions</span>
          <strong>{data.activeSessions}</strong>
          <span className="id-kpi-note">Across 3 departments</span>
        </article>

        <article className="id-kpi">
          <span className="id-kpi-label">Staff</span>
          <strong>{data.staff}</strong>
          <span className="id-kpi-note id-positive">{data.activeStaff} active</span>
        </article>

        <article className="id-kpi">
          <span className="id-kpi-label">Sessions</span>
          <strong>{data.sessionsThisMonth}</strong>
          <span className="id-kpi-note">This month</span>
        </article>

        <article className="id-kpi">
          <span className="id-kpi-label">Usage</span>
          <strong>{data.usageHours.toFixed(1)}h</strong>
          <span className="id-kpi-note id-positive">{data.usagePlanPercent}% under plan</span>
        </article>
      </section>

      <section className="id-section">
        <div className="id-section-heading">
          <h2>Alerts feed</h2>
          <p>Recent institution notices</p>
        </div>

        <div className="id-panel id-alerts">
          {ALERTS.map((alert) => {
            const Icon = alert.icon;

            return (
              <button
                type="button"
                className="id-alert"
                key={alert.id}
                onClick={() => goTo(alert.action)}
                aria-label={`${alert.title}. ${alert.detail}`}
              >
                <span className={`id-alert-icon id-alert-icon--${alert.type}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>

                <span className="id-alert-copy">
                  <strong>{alert.title}</strong>
                  <small>{alert.detail}</small>
                </span>

                <span className="id-alert-time">{alert.time}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="id-panel id-activity">
        <div className="id-activity-heading">
          <div>
            <h2>Session activity</h2>
            <p>{weekly ? 'Last 7 days' : 'Daily activity overview'}</p>
          </div>

          <button
            type="button"
            className="id-weekly-toggle"
            onClick={() => setWeekly((value) => !value)}
            aria-pressed={weekly}
          >
            {weekly ? 'Weekly' : 'Daily'}
          </button>
        </div>

        <div
          className="id-chart"
          role="img"
          aria-label="Session activity for the seven days of the week"
        >
          {data.weeklyActivity.map((value, index) => {
            const height = weekly ? value : Math.max(12, Math.round(value * 0.65));

            return (
              <div className="id-chart-day" key={`${index}-${WEEKDAYS[index]}`}>
                <div className="id-chart-bar-area">
                  <div
                    className="id-chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${WEEKDAYS[index]}: ${value} activity units`}
                  />
                </div>
                <span>{WEEKDAYS[index]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="id-section id-sessions-section">
        <div className="id-section-heading">
          <h2>Staff active sessions</h2>
          <p className="id-teal">{data.activeSessions} staff members currently in a session</p>
        </div>

        <div className="id-panel id-table-panel">
          <div className="id-table-toolbar">
            <label className="id-search">
              <span className="id-visually-hidden">Search sessions</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member, department or interpreter"
              />
            </label>
          </div>

          <div className="id-table-scroll">
            <table className="id-table">
              <thead>
                <tr>
                  <th scope="col">Staff member</th>
                  <th scope="col">Department</th>
                  <th scope="col">Interpreter</th>
                  <th scope="col">Start time</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="id-member">{session.member}</td>
                    <td>{session.department}</td>
                    <td>{session.interpreter}</td>
                    <td>{session.startTime}</td>
                    <td>{session.duration}</td>
                    <td>
                      <span className={`id-status id-status--${session.status.toLowerCase()}`}>
                        <span />
                        {session.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="id-view-link"
                        onClick={() => viewSession(session.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="id-empty">
                      No sessions match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="id-table-footer">
            Showing {filteredSessions.length} of {data.activeSessions} active sessions
          </p>
        </div>
      </section>

      <section className="id-section">
        <div className="id-section-heading">
          <h2>Departments</h2>
          <p>VRI usage overview by department</p>
        </div>

        <div className="id-departments">
          {data.departments.map((department) => (
            <button
              type="button"
              className="id-department"
              key={department.name}
              onClick={() =>
                navigate(
                  `/dashboard/institution/sessions?department=${encodeURIComponent(department.name)}`,
                )
              }
            >
              <strong>{department.name}</strong>
              <span>
                {department.sessionsToday} {department.sessionsToday === 1 ? 'session' : 'sessions'}{' '}
                today
              </span>
              <span className="id-teal">{department.active} active</span>
            </button>
          ))}
        </div>
      </section>

      <section className="id-section">
        <div className="id-section-heading">
          <h2>Quick actions</h2>
        </div>

        <div className="id-quick-actions">
          <button type="button" className="id-button id-button--primary" onClick={createStaff}>
            <Plus size={17} aria-hidden="true" />
            Create staff account
          </button>

          <button type="button" className="id-button" onClick={() => goTo('sessions')}>
            View sessions
          </button>

          <button type="button" className="id-button" onClick={() => goTo('analytics')}>
            View analytics
          </button>
        </div>
      </section>

      <section className="id-panel id-attention">
        <h2>Needs attention</h2>

        <button type="button" className="id-attention-item" onClick={() => goTo('staff')}>
          <span className="id-attention-dot id-attention-dot--purple" />
          {data.pendingStaff} staff accounts pending activation
        </button>

        <button type="button" className="id-attention-item" onClick={() => goTo('sessions')}>
          <span className="id-attention-dot id-attention-dot--red" />
          {data.flaggedSessions} session flagged for review
        </button>
      </section>

      <div className="id-dashboard-footer" aria-hidden="true">
        <CircleUserRound size={14} />
        <span>Institution workspace</span>
      </div>
    </div>
  );
}

export default InstitutionDashboardPage;
