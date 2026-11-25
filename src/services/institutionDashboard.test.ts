import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstitutionDashboardData, getInstitutionOverview } from './institutionDashboard';

vi.mock('./api', () => ({
  api: vi.fn(),
}));

import { api } from './api';

beforeEach(() => vi.mocked(api).mockReset());

describe('getInstitutionOverview', () => {
  it('reads the institution name, the role and the staff counts', async () => {
    vi.mocked(api).mockResolvedValue({
      user: { id: 1 },
      institution: {
        id: 3,
        organisation_name: 'Northside Medical Center',
        status: 'approved',
      },
      institutional_role: 'STAFF',
      staff_summary: { total: 12, active: 10, revoked: 2 },
    });

    expect(await getInstitutionOverview()).toEqual({
      name: 'Northside Medical Center',
      role: 'STAFF',
      staff: { total: 12, active: 10, revoked: 2 },
    });

    expect(api).toHaveBeenCalledWith('/api/v1/dashboard/institution/');
  });
});

describe('getInstitutionDashboardData', () => {
  it('reads and maps institution, staff and session analytics', async () => {
    vi.mocked(api).mockResolvedValue({
      user: { id: 1 },
      institution: {
        id: 3,
        organisation_name: 'Northside Medical Center',
        status: 'approved',
      },
      institutional_role: 'STAFF',
      staff_summary: { total: 12, active: 10, revoked: 2 },
      session_analytics: {
        total_requests: 100,
        pending_requests: 15,
        assigned_requests: 10,
        completed_requests: 60,
        cancelled_requests: 8,
        failed_requests: 7,
        active_sessions: 2,
        sessions_this_month: 61,
        total_video_sessions: 75,
        waiting_video_sessions: 5,
        connecting_video_sessions: 3,
        connected_video_sessions: 10,
        ended_video_sessions: 50,
        failed_video_sessions: 7,
        average_call_duration_seconds: 300,
      },
    });

    expect(await getInstitutionDashboardData()).toEqual({
      institutionName: 'Northside Medical Center',
      staff: {
        total: 12,
        active: 10,
        revoked: 2,
      },
      sessions: {
        activeSessions: 2,
        sessionsThisMonth: 61,
        totalRequests: 100,
        pendingRequests: 15,
        completedRequests: 60,
        cancelledRequests: 8,
        failedRequests: 7,
        totalVideoSessions: 75,
        waitingVideoSessions: 5,
        connectingVideoSessions: 3,
        connectedVideoSessions: 10,
        endedVideoSessions: 50,
        failedVideoSessions: 7,
        averageCallDurationSeconds: 300,
      },
    });

    expect(api).toHaveBeenCalledWith('/api/v1/dashboard/institution/');
  });
});
