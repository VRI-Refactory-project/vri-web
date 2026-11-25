import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '../../components/TablePagination';
import { CircleUserRound, Plus } from 'lucide-react';

import { getInstitutionDashboardData } from '../../services/institutionDashboard';

import { getInstitutionUsage, toIsoDay } from '../../services/institutionUsage';

import { api } from '../../services/api';

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

interface InstitutionSessionApi {
  id: number;
  staff: {
    id: number | null;
    name: string;
    department: string;
  };
  interpreter_name: string | null;
  specialisation_required: string;
  priority: string;
  status: string;
  display_status: string;
  created_at: string;
  assigned_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
}

interface Department {
  name: string;
  sessionsThisMonth: number;
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
  revokedStaff: number;
  flaggedSessions: number;
  weeklyActivity: number[];
  departments: Department[];
  sessions: StaffSession[];
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SESSION_PAGE_SIZE = 5;

export interface InstitutionDashboardPageProps {
  onCreateStaff?: () => void;
  onViewSession?: (sessionId: string) => void;
}

export function InstitutionDashboardPage({
  onCreateStaff,
  onViewSession,
}: InstitutionDashboardPageProps) {
  const navigate = useNavigate();
  const [weekly, setWeekly] = useState(true);
  const [search, setSearch] = useState('');
  const [sessionPage, setSessionPage] = useState(1);

  const [orgName, setOrgName] = useState('');
  // The staff figures are real (GET /dashboard/institution/). The session, usage and department
  // figures stay empty until the API can report them for an institution.
  const [data, setData] = useState<InstitutionDashboardData>({
    activeSessions: 0,
    staff: 0,
    activeStaff: 0,
    sessionsThisMonth: 0,
    usageHours: 0,
    usagePlanPercent: 0,
    alerts: 0,
    revokedStaff: 0,
    flaggedSessions: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    departments: [],
    sessions: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const today = new Date();

      const from = toIsoDay(new Date(today.getFullYear(), today.getMonth(), 1));

      const to = toIsoDay(today);

      const [dashboardResult, usageResult, sessionsResult] = await Promise.allSettled([
        getInstitutionDashboardData(),
        getInstitutionUsage({ from, to }),
        api<InstitutionSessionApi[]>('/api/v1/institutions/me/sessions/?state=active'),
      ]);

      if (cancelled) return;

      // Dashboard analytics and staff figures
      if (dashboardResult.status === 'fulfilled') {
        const dashboard = dashboardResult.value;

        setOrgName(dashboard.institutionName);

        setData((current) => ({
          ...current,
          staff: dashboard.staff.total,
          activeStaff: dashboard.staff.active,
          revokedStaff: dashboard.staff.revoked,
        }));
      } else {
        console.error('Could not load institution dashboard:', dashboardResult.reason);
      }

      // Monthly usage and weekly activity
      if (usageResult.status === 'fulfilled') {
        const usage = usageResult.value;

        const weeklyData = usage.overTime.slice(-7);

        setData((current) => ({
          ...current,
          sessionsThisMonth: usage.sessions,
          usageHours: usage.totalMinutes / 60,
          weeklyActivity: weeklyData.map((day) => day.count),
        }));
      } else {
        console.error('Could not load institution usage:', usageResult.reason);
      }

      // Active interpreter requests
      if (sessionsResult.status === 'fulfilled') {
        const requests = sessionsResult.value;

        const mappedSessions: StaffSession[] = requests.map((session) => {
          const status = session.display_status.toUpperCase();

          let displayStatus: SessionStatus = 'Pending';

          if (status === 'ACTIVE') {
            displayStatus = 'Live';
          } else if (status === 'COMPLETED') {
            displayStatus = 'Ended';
          }

          const startDate = new Date(session.created_at);

          return {
            id: String(session.id),
            member: session.staff.name,
            department: session.staff.department || 'No department',
            interpreter: session.interpreter_name || 'Not assigned',
            startTime: Number.isNaN(startDate.getTime()) ? '—' : startDate.toLocaleString(),
            duration: session.duration_minutes !== null ? `${session.duration_minutes} min` : '—',
            status: displayStatus,
          };
        });

        // Count active requests by staff category/department
        const activeByDepartment = new Map<string, number>();

        mappedSessions.forEach((session) => {
          const department = session.department;

          activeByDepartment.set(department, (activeByDepartment.get(department) || 0) + 1);
        });

        setData((current) => ({
          ...current,
          activeSessions: requests.length,
          sessions: mappedSessions,
        }));
      } else {
        console.error('Could not load active institution sessions:', sessionsResult.reason);
      }

      // Combine monthly usage and active requests by department
      const monthlyByDepartment = new Map<string, number>();
      const activeByDepartment = new Map<string, number>();

      if (usageResult.status === 'fulfilled') {
        usageResult.value.byDepartment.forEach((department) => {
          const name = department.label || 'No department';
          monthlyByDepartment.set(name, department.count);
        });
      }

      if (sessionsResult.status === 'fulfilled') {
        sessionsResult.value.forEach((request) => {
          const department = request.staff.department || 'No department';

          activeByDepartment.set(department, (activeByDepartment.get(department) || 0) + 1);
        });
      }

      const departmentNames = new Set([
        ...monthlyByDepartment.keys(),
        ...activeByDepartment.keys(),
      ]);

      setData((current) => ({
        ...current,
        departments: Array.from(departmentNames).map((name) => ({
          name,
          sessionsThisMonth: monthlyByDepartment.get(name) || 0,
          active: activeByDepartment.get(name) || 0,
        })),
      }));
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.sessions;

    return data.sessions.filter((session) =>
      [session.member, session.department, session.interpreter, session.id].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [data.sessions, search]);
  const sessionPageCount = Math.max(1, Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE));
  const currentSessionPage = Math.min(sessionPage, sessionPageCount);
  const visibleSessions = filteredSessions.slice(
    (currentSessionPage - 1) * SESSION_PAGE_SIZE,
    currentSessionPage * SESSION_PAGE_SIZE,
  );

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
          <p>{orgName ? `${orgName} · ` : ''}Here’s what’s happening today.</p>
        </div>
      </header>

      <section className="id-kpis" aria-label="Institution overview">
        <article className="id-kpi">
          <span className="id-kpi-label">Active sessions</span>
          <strong>{data.activeSessions}</strong>
          {/* Fixed: Added span tag back */}
          <span className="id-kpi-note">
            {data.activeSessions > 0
              ? `Across ${data.departments.length} departments`
              : 'No active sessions'}
          </span>
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
          <span className="id-kpi-note">Total usage this month</span>
        </article>
      </section>

      {/* Cleaned up Alerts Feed */}
      <section className="id-section">
        <div className="id-section-heading">
          <h2>Alerts feed</h2>
          <p>Recent institution notices</p>
        </div>

        <div className="id-panel id-alerts">
          <p style={{ padding: '24px', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
            No new alerts.
          </p>
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
            // Added Math.max to prevent bars from disappearing completely when value is 0
            const height = weekly ? Math.max(value, 2) : Math.max(12, Math.round(value * 0.65));

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
          <p className="id-teal">{data.sessions.length} active interpreter requests</p>
        </div>

        <div className="id-panel id-table-panel">
          <div className="id-table-toolbar">
            <label className="id-search">
              <span className="id-visually-hidden">Search sessions</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSessionPage(1);
                }}
                placeholder="Search member, department or interpreter"
              />
            </label>
          </div>

          <div className="id-table-scroll mobile-data-cards">
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
                {visibleSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="id-session-row"
                    role="link"
                    tabIndex={0}
                    aria-label={`View session for ${session.member}`}
                    onClick={(event) => {
                      if (
                        !(event.target as HTMLElement).closest('button, a, input, select, textarea')
                      ) {
                        viewSession(session.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        (event.key === 'Enter' || event.key === ' ') &&
                        event.target === event.currentTarget
                      ) {
                        event.preventDefault();
                        viewSession(session.id);
                      }
                    }}
                  >
                    <td className="id-member" data-card-primary>
                      {session.member}
                    </td>
                    <td data-label="Department">{session.department}</td>
                    <td data-label="Interpreter">{session.interpreter}</td>
                    <td data-label="Start time">{session.startTime}</td>
                    <td data-label="Duration">{session.duration}</td>
                    <td data-label="Status">
                      <span className={`id-status id-status--${session.status.toLowerCase()}`}>
                        <span />
                        {session.status}
                      </span>
                    </td>
                    <td data-card-actions>
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
                      {search ? 'No sessions match your search.' : 'No active sessions right now.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentSessionPage}
            pageSize={SESSION_PAGE_SIZE}
            total={filteredSessions.length}
            label="sessions"
            onPageChange={setSessionPage}
          />

          <p className="id-table-footer">
            Showing {filteredSessions.length} of {data.sessions.length} active requests
          </p>
        </div>
      </section>

      <section className="id-section">
        <div className="id-section-heading">
          <h2>Departments</h2>
          <p>VRI usage overview by department</p>
        </div>

        <div className="id-departments">
          {data.departments.length === 0 && (
            <p style={{ color: 'gray', padding: '10px 0' }}>No departments added yet.</p>
          )}

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
                {department.sessionsThisMonth}{' '}
                {department.sessionsThisMonth === 1 ? 'session' : 'sessions'} this month
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
          {data.revokedStaff} staff {data.revokedStaff === 1 ? 'account' : 'accounts'} with access
          revoked
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
