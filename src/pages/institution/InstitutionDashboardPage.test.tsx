import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionDashboardPage } from './InstitutionDashboardPage';

const mocks = vi.hoisted(() => ({
  dashboardLoad: (() => Promise.resolve({})) as () => Promise<unknown>,
  usageLoad: (() => Promise.resolve({})) as () => Promise<unknown>,
  sessionsLoad: (() => Promise.resolve([])) as () => Promise<unknown>,
}));

vi.mock('../../services/institutionDashboard', () => ({
  getInstitutionDashboardData: () => mocks.dashboardLoad(),
}));

vi.mock('../../services/institutionUsage', () => ({
  getInstitutionUsage: () => mocks.usageLoad(),
  toIsoDay: (date: Date) => date.toISOString().slice(0, 10),
}));

vi.mock('../../services/api', () => ({
  api: () => mocks.sessionsLoad(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <InstitutionDashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.dashboardLoad = () =>
    Promise.resolve({
      institutionName: 'Northside Medical Center',
      staff: {
        total: 12,
        active: 10,
        revoked: 2,
      },
      sessions: {
        totalRequests: 20,
        pendingRequests: 3,
        completedRequests: 15,
        cancelledRequests: 1,
        failedRequests: 1,
        totalVideoSessions: 10,
        waitingVideoSessions: 1,
        connectingVideoSessions: 1,
        connectedVideoSessions: 4,
        endedVideoSessions: 3,
        failedVideoSessions: 1,
        averageCallDurationSeconds: 300,
      },
    });

  mocks.usageLoad = () =>
    Promise.resolve({
      sessions: 20,
      previousPeriodSessions: 15,
      completed: 15,
      completionRate: 75,
      totalMinutes: 120,
      avgDurationMinutes: 8,
      byType: [],
      byOutcome: [],
      byDepartment: [
        { label: 'Outpatient', count: 12 },
        { label: 'Emergency', count: 8 },
      ],
      overTime: [
        { date: '2026-11-12', count: 2 },
        { date: '2026-11-13', count: 3 },
        { date: '2026-11-14', count: 1 },
        { date: '2026-11-15', count: 4 },
        { date: '2026-11-16', count: 2 },
        { date: '2026-11-17', count: 5 },
        { date: '2026-11-18', count: 3 },
      ],
      staff: {
        total: 12,
        usedVri: 8,
        notUsed: 4,
      },
    });

  mocks.sessionsLoad = () =>
    Promise.resolve([
      {
        id: 101,
        staff: {
          id: 1,
          name: 'Jane Doe',
          department: 'Outpatient',
        },
        interpreter_name: 'Mary Interpreter',
        specialisation_required: 'Medical',
        priority: 'NORMAL',
        status: 'ACTIVE',
        display_status: 'ACTIVE',
        created_at: '2026-11-18T09:00:00Z',
        assigned_at: '2026-11-18T09:02:00Z',
        ended_at: null,
        duration_minutes: 12,
      },
    ]);
});

describe('InstitutionDashboardPage', () => {
  it('shows the institution and its real staff numbers', async () => {
    renderPage();

    expect(await screen.findByText(/Northside Medical Center/)).toBeInTheDocument();

    const staff = screen.getByText('Staff', { selector: '.id-kpi-label' }).closest('article');

    expect(staff).toHaveTextContent('12');
    expect(staff).toHaveTextContent('10 active');

    expect(screen.getByText('2 staff accounts with access revoked')).toBeInTheDocument();
  });

  it('shows usage figures from the institution usage API', async () => {
    renderPage();

    const sessions = await screen.findByText('Sessions', {
      selector: '.id-kpi-label',
    });

    expect(sessions.closest('article')).toHaveTextContent('20');

    const usage = screen.getByText('Usage', {
      selector: '.id-kpi-label',
    });

    expect(usage.closest('article')).toHaveTextContent('2.0h');
  });

  it('shows active interpreter requests from the sessions API', async () => {
    renderPage();

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Mary Interpreter')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('still opens when the API requests fail', async () => {
    mocks.dashboardLoad = () => Promise.reject(new Error('dashboard offline'));
    mocks.usageLoad = () => Promise.reject(new Error('usage offline'));
    mocks.sessionsLoad = () => Promise.reject(new Error('sessions offline'));

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: 'Institution dashboard',
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText('0 staff accounts with access revoked')).toBeInTheDocument();
  });
});
