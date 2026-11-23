import { api } from './api';

/** How a session came about: asked for there and then, or booked ahead (V2-030). */
export type SessionChannel = 'on_demand' | 'booked';

/**
 * One session from the institution's session history: metadata only. The API never sends what was
 * said in a session, and this type has nowhere to put it.
 */
export interface InstitutionSession {
  id: number;
  staff: { id: number | null; name: string; department: string };
  channel: SessionChannel;
  interpreter_name: string | null;
  specialisation_required: string;
  priority: 'NORMAL' | 'EMERGENCY';
  status: string;
  display_status: string;
  created_at: string;
  assigned_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
}

/** Waiting for or with an interpreter, or finished (completed, cancelled or failed). */
export type SessionState = 'active' | 'history';

/**
 * The institution's sessions, newest first. An administrator gets every staff member's; anyone else
 * only their own (the server decides).
 */
export function listInstitutionSessions(state: SessionState, search = '') {
  const query = new URLSearchParams({ state });
  if (search.trim()) query.set('search', search.trim());
  return api<InstitutionSession[]>(`/api/v1/institutions/me/sessions/?${query}`);
}

/** One session. Anything outside what the person may see comes back as a 404. */
export function getInstitutionSession(id: string) {
  return api<InstitutionSession>(`/api/v1/institutions/me/sessions/${id}/`);
}

export const CHANNEL_LABEL: Record<SessionChannel, string> = {
  on_demand: 'On demand',
  booked: 'Booked',
};

const OUTCOME_LABEL: Record<string, string> = {
  CREATED: 'Waiting',
  PENDING: 'Waiting',
  OFFERED: 'Waiting',
  ASSIGNED: 'In progress',
  CONNECTING: 'Connecting',
  ACTIVE: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'No interpreter found',
};

/** What happened to the session, in words. */
export const outcomeLabel = (session: InstitutionSession) =>
  OUTCOME_LABEL[session.display_status] ?? OUTCOME_LABEL[session.status] ?? session.status;

/** General, Medical or Legal. */
export const sessionTypeLabel = (session: InstitutionSession) =>
  session.specialisation_required.charAt(0) +
  session.specialisation_required.slice(1).toLowerCase();

/** "12 min", "1 h 5 min", or a dash when the session never ran. */
export function formatDuration(minutes: number | null) {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
}

/** "Mon 16 Nov 2026, 10:05". */
export const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
