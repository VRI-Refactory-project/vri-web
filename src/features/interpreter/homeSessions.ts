import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { photoSrc } from '../../services/photos';

/** One item from GET /api/v1/interpreters/me/sessions/ (InterpreterSessionSerializer), newest first. */
interface ApiSession {
  id: number;
  status: 'ASSIGNED' | 'COMPLETED';
  requester_name: string;
  requester_photo: string | null;
  assigned_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
}

/** A session the interpreter took, ready for the home page cards. */
export interface HomeSession {
  id: number;
  /** The Deaf user the session is with. */
  withName: string;
  /** Full address of their photo, or null when they have none. */
  photo: string | null;
  /** True while the session is still going. */
  running: boolean;
  /** ISO date and time the interpreter accepted it. */
  startedAt: string;
  /** How long it lasted. Null while it is running. */
  durationMinutes: number | null;
}

/** The sessions the signed-in interpreter took. Quietly empty if they cannot be loaded. */
export function useMySessions() {
  const [sessions, setSessions] = useState<HomeSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    api<ApiSession[]>('/api/v1/interpreters/me/sessions/').then(
      (data) => {
        if (cancelled || !Array.isArray(data)) return;
        setSessions(
          data
            .filter((s) => s.assigned_at)
            .map((s) => ({
              id: s.id,
              withName: s.requester_name,
              photo: photoSrc(s.requester_photo),
              running: s.status === 'ASSIGNED',
              startedAt: s.assigned_at as string,
              durationMinutes: s.duration_minutes,
            })),
        );
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { sessions };
}

/** The latest sessions, newest first. One that is still going is kept first so it can be rejoined. */
export function recentSessions(sessions: HomeSession[], count = 5) {
  const running = sessions.filter((s) => s.running);
  const finished = sessions.filter((s) => !s.running);
  return [...running, ...finished].slice(0, count);
}

/** The sessions that started on this day. */
export const sessionsOn = (sessions: HomeSession[], day: Date) =>
  sessions.filter((s) => new Date(s.startedAt).toDateString() === day.toDateString());

/** The sessions that started this week. The week starts on Monday, like the calendar. */
export function sessionsThisWeek(sessions: HomeSession[], now = new Date()) {
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  );
  return sessions.filter((s) => new Date(s.startedAt) >= monday);
}

/** "2:30 PM". */
export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
