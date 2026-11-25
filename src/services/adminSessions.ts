import { api } from './api';

/**
 * The administrator's live-session monitor (V2-047). Metadata only: who is on a call, its type,
 * channel, status and timings. The API never sends what was said, and these types have nowhere to
 * put it.
 */

export type LiveStatus = 'waiting' | 'connecting' | 'connected' | 'ended' | 'failed';
export type AttentionReason = 'emergency' | 'stuck' | 'over_duration' | 'flagged';
export type LiveFilter = 'all' | 'connecting' | 'attention';

export interface LiveSession {
  id: number;
  channel: 'on_demand' | 'booked';
  status: LiveStatus;
  status_label: string;
  priority: 'NORMAL' | 'EMERGENCY';
  session_type: string;
  sector: string;
  requester: { name: string; role: string; role_label: string };
  interpreter: { name: string } | null;
  created_at: string;
  connected_at: string | null;
  minutes_running: number;
  needs_attention: AttentionReason[];
  flag: { flagged_by: string; note: string; flagged_at: string } | null;
  /** Warnings an admin has marked as seen: still true, but no longer counted as needing attention. */
  seen: { seen_by: string; seen_at: string; reasons: AttentionReason[] } | null;
}

export interface LiveStats {
  liveNow: number;
  connecting: number;
  connectingAverageSeconds: number;
  needsAttention: number;
  attention: Record<AttentionReason, number>;
}

/** GET /api/v1/dashboard/admin/sessions-stats/ */
export const fetchLiveStats = () => api<LiveStats>('/api/v1/dashboard/admin/sessions-stats/');

/** GET /api/v1/dashboard/admin/sessions/: every call waiting, connecting or connected, newest first. */
export const fetchLiveSessions = () => api<LiveSession[]>('/api/v1/dashboard/admin/sessions/');

const flagUrl = (id: number) => `/api/v1/dashboard/admin/sessions/${id}/flag/`;

/** Mark a live call for follow-up. Written to the audit log. Returns the updated row. */
export const flagSession = (id: number, note: string) =>
  api<LiveSession>(flagUrl(id), { method: 'POST', body: JSON.stringify({ note }) });

/** Mark a call's follow-up done (clears the flag). Written to the audit log. Returns the updated row. */
export const clearSessionFlag = (id: number) => api<LiveSession>(flagUrl(id), { method: 'DELETE' });

/** Mark a call's current warnings as seen. Written to the audit log. Returns the updated row. */
export const markSessionSeen = (id: number) =>
  api<LiveSession>(`/api/v1/dashboard/admin/sessions/${id}/seen/`, { method: 'POST' });

/** Warnings the system works out by itself (as opposed to an admin's follow-up mark). */
export const hasWarnings = (session: LiveSession) =>
  session.needs_attention.some((reason) => reason !== 'flagged');

const LIVE: LiveStatus[] = ['waiting', 'connecting', 'connected'];

/** Still on the monitor: an ended or failed call drops off it. */
export const isLive = (session: LiveSession) => LIVE.includes(session.status);

/** Which rows a filter keeps (WEB-02). */
export function matchesFilter(session: LiveSession, filter: LiveFilter) {
  if (filter === 'connecting') return session.status !== 'connected';
  if (filter === 'attention') return session.needs_attention.length > 0;
  return true;
}

/** What a search matches: the session number, the people on it, or the institution. */
export function matchesSearch(session: LiveSession, query: string) {
  const q = query.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;
  return (
    String(session.id) === q ||
    [session.requester.name, session.interpreter?.name ?? '', session.sector].some((field) =>
      field.toLowerCase().includes(q),
    )
  );
}

/** Why a call needs attention, in words. */
export function reasonLabel(reason: AttentionReason, session: LiveSession) {
  switch (reason) {
    case 'emergency':
      return 'Emergency';
    case 'stuck':
      return session.status === 'waiting' ? 'Waiting too long' : 'Stuck connecting';
    case 'over_duration':
      return 'Over expected time';
    case 'flagged':
      return 'Follow up';
  }
}

export const CHANNEL_LABEL: Record<LiveSession['channel'], string> = {
  on_demand: 'On demand',
  booked: 'Booked',
};

/** General, Medical or Legal. */
export const sessionTypeLabel = (session: LiveSession) =>
  session.session_type.charAt(0) + session.session_type.slice(1).toLowerCase();

/** "Connected · 1 h 5 min" or "Waiting · 3 min". */
export function timingLabel(session: LiveSession) {
  const minutes = session.minutes_running;
  const length =
    minutes < 60
      ? `${minutes} min`
      : minutes % 60
        ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
        : `${minutes / 60} h`;
  return `${session.status_label} · ${length}`;
}
