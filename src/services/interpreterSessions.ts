/**
 * The interpreter's booked sessions. There is no booking backend yet: set
 * VITE_MOCK_INTERPRETER_SESSIONS=true in .env.local to see it filled with sample data; without it the
 * page shows an honest "not live yet".
 */

export type SessionStatus = 'upcoming' | 'completed';

export const STATUS_LABEL: Record<SessionStatus, string> = {
  upcoming: 'Yet to start',
  completed: 'Completed',
};

export type SessionFilter = 'all' | SessionStatus;

export interface InterpreterSession {
  id: string;
  /** Who the session is with: a Deaf person or an institution. */
  withName: string;
  /** e.g. "Interpreted call" */
  type: string;
  /** ISO date and time the session starts. */
  start: string;
  durationMinutes: number;
  status: SessionStatus;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Sample sessions placed around "now", so "Today" and "starts in 10 mins" stay true whenever it runs. */
function sample(now = Date.now()): InterpreterSession[] {
  const at = (offset: number) => new Date(now + offset).toISOString();
  return [
    {
      id: '1',
      withName: 'Micheal Kiggundu',
      type: 'Interpreted call',
      start: at(10 * MINUTE),
      durationMinutes: 60,
      status: 'upcoming',
    },
    {
      id: '2',
      withName: 'Mulago Hospital',
      type: 'Interpreted call',
      start: at(-17 * DAY),
      durationMinutes: 45,
      status: 'completed',
    },
    {
      id: '3',
      withName: 'Zipporah Tabuti',
      type: 'Interpreted call',
      start: at(-50 * DAY),
      durationMinutes: 30,
      status: 'completed',
    },
  ];
}

const sessionsMocked = () => import.meta.env.VITE_MOCK_INTERPRETER_SESSIONS === 'true';

/** The interpreter's sessions, or null while booking is not live. */
export async function getInterpreterSessions(): Promise<InterpreterSession[] | null> {
  return sessionsMocked() ? sample() : null;
}

const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** The soonest session still to come, or null. */
export function nextSession(sessions: InterpreterSession[]): InterpreterSession | null {
  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  upcoming.sort((a, b) => a.start.localeCompare(b.start));
  return upcoming[0] ?? null;
}

/** Upcoming first (soonest at the top), then past sessions (latest at the top). */
export function orderSessions(sessions: InterpreterSession[]): InterpreterSession[] {
  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const past = sessions.filter((s) => s.status !== 'upcoming');
  upcoming.sort((a, b) => a.start.localeCompare(b.start));
  past.sort((a, b) => b.start.localeCompare(a.start));
  return [...upcoming, ...past];
}

/** Keep the sessions with this status whose name contains the search, ignoring case. */
export function filterSessions(
  sessions: InterpreterSession[],
  filter: SessionFilter,
  search: string,
): InterpreterSession[] {
  const q = search.trim().toLowerCase();
  return sessions.filter(
    (s) => (filter === 'all' || s.status === filter) && s.withName.toLowerCase().includes(q),
  );
}

/** "Today", "Tomorrow" or "Oct 13". */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, new Date(now.getTime() + DAY))) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Today at 2:30 PM – 3:30 PM". */
export function whenLabel(session: InterpreterSession, now = new Date()): string {
  const start = new Date(session.start);
  const end = new Date(start.getTime() + session.durationMinutes * MINUTE);
  return `${dayLabel(session.start, now)} at ${time(start)} – ${time(end)}`;
}

/** "starts in 10 mins", "starts today at 4:00 PM", "starts Oct 13" or "starting now". */
export function startsLabel(iso: string, now = new Date()): string {
  const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / MINUTE);
  if (minutes <= 0) return 'starting now';
  if (minutes < 60) return `starts in ${minutes} min${minutes === 1 ? '' : 's'}`;
  const day = dayLabel(iso, now);
  return day === 'Today' ? `starts today at ${time(new Date(iso))}` : `starts ${day}`;
}

/** The little date box in the table: { top: "TODAY" or "OCT", day: "30" }. */
export function dateTile(iso: string, now = new Date()) {
  const d = new Date(iso);
  const top = sameDay(d, now)
    ? 'TODAY'
    : d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { top, day: String(d.getDate()) };
}

/** "45 mins", "1 hr" or "1 hr 30 mins". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const mins = rest ? `${rest} min${rest === 1 ? '' : 's'}` : '';
  if (!hours) return mins;
  return [`${hours} hr${hours === 1 ? '' : 's'}`, mins].filter(Boolean).join(' ');
}

/** The time under the name: the start time while it is coming up, the length once it is done. */
export const sessionDetail = (session: InterpreterSession) =>
  session.status === 'upcoming'
    ? time(new Date(session.start))
    : formatDuration(session.durationMinutes);

/** "1 upcoming · 2 completed", leaving out whichever is zero. */
export function countLabel(sessions: InterpreterSession[]): string {
  const upcoming = sessions.filter((s) => s.status === 'upcoming').length;
  const completed = sessions.length - upcoming;
  const parts = [upcoming && `${upcoming} upcoming`, completed && `${completed} completed`];
  return parts.filter(Boolean).join(' · ') || 'No sessions';
}
