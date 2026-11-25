import { toInstitutionRole } from '../features/auth/roles';
import type { InstitutionRole } from '../types';
import { api } from './api';

export interface InstitutionOverview {
  name: string;
  role: InstitutionRole | null;
  staff: {
    total: number;
    active: number;
    revoked: number;
  };
}

export interface InstitutionDashboardData {
  institutionName: string;
  staff: {
    total: number;
    active: number;
    revoked: number;
  };
  sessions: {
    activeSessions: number;
    sessionsThisMonth: number;
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    failedRequests: number;
    totalVideoSessions: number;
    waitingVideoSessions: number;
    connectingVideoSessions: number;
    connectedVideoSessions: number;
    endedVideoSessions: number;
    failedVideoSessions: number;
    averageCallDurationSeconds: number;
  };
}

interface ApiOverview {
  institution: {
    organisation_name: string;
  };
  institutional_role?: string | null;
  staff_summary: {
    total: number;
    active: number;
    revoked: number;
  };
  session_analytics: {
    total_requests: number;
    pending_requests: number;
    assigned_requests: number;
    completed_requests: number;
    cancelled_requests: number;
    failed_requests: number;
    active_sessions: number;
    sessions_this_month: number;
    total_video_sessions: number;
    waiting_video_sessions: number;
    connecting_video_sessions: number;
    connected_video_sessions: number;
    ended_video_sessions: number;
    failed_video_sessions: number;
    average_call_duration_seconds: number;
  };
}

async function fetchInstitutionDashboard(): Promise<ApiOverview> {
  return api<ApiOverview>('/api/v1/dashboard/institution/');
}

export async function getInstitutionOverview(): Promise<InstitutionOverview> {
  const raw = await fetchInstitutionDashboard();

  return {
    name: raw.institution.organisation_name,
    role: toInstitutionRole(raw.institutional_role),
    staff: {
      total: raw.staff_summary.total,
      active: raw.staff_summary.active,
      revoked: raw.staff_summary.revoked,
    },
  };
}

export async function getInstitutionDashboardData(): Promise<InstitutionDashboardData> {
  const raw = await fetchInstitutionDashboard();
  const analytics = raw.session_analytics;

  return {
    institutionName: raw.institution.organisation_name,
    staff: raw.staff_summary,
    sessions: {
      activeSessions: analytics.active_sessions,
      sessionsThisMonth: analytics.sessions_this_month,
      totalRequests: analytics.total_requests,
      pendingRequests: analytics.pending_requests,
      completedRequests: analytics.completed_requests,
      cancelledRequests: analytics.cancelled_requests,
      failedRequests: analytics.failed_requests,
      totalVideoSessions: analytics.total_video_sessions,
      waitingVideoSessions: analytics.waiting_video_sessions,
      connectingVideoSessions: analytics.connecting_video_sessions,
      connectedVideoSessions: analytics.connected_video_sessions,
      endedVideoSessions: analytics.ended_video_sessions,
      failedVideoSessions: analytics.failed_video_sessions,
      averageCallDurationSeconds: analytics.average_call_duration_seconds,
    },
  };
}
