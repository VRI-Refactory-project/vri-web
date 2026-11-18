import { useCallback, useEffect, useState } from 'react';
import { api, describeError } from '../../services/api';
import { photoSrc } from '../../services/photos';

/** One item from GET /api/v1/interpreters/booked-sessions/ (BookedSessionSerializer), soonest first. */
interface ApiBooking {
  id: number;
  deaf_name: string;
  deaf_photo: string | null;
  date: string; // "2026-11-12"
  time: string; // "15:30:00"
  duration: number; // minutes
  session_type_label: string; // e.g. "Medical / Healthcare"
  status: 'PENDING' | 'CONFIRMED';
  /** "offered": asked to take it; "confirmed": it is this interpreter's. Older servers omit it. */
  my_state?: 'offered' | 'confirmed';
  /** True from 10 minutes before the start: the call can be opened. */
  can_join?: boolean;
}

/** A session a Deaf user booked, ready for the home page cards. */
export interface BookedSession {
  id: number;
  /** The Deaf user who booked it. */
  withName: string;
  /** Full address of their photo, or null when they have none. */
  photo: string | null;
  /** e.g. "Medical / Healthcare". */
  typeLabel: string;
  /** Date and time it starts, without a time zone, so it is read as the device's own time. */
  startsAt: string;
  durationMinutes: number;
  /** The interpreter has been asked and has not answered yet. */
  offered: boolean;
  confirmed: boolean;
  /** The call can be opened now. */
  canJoin: boolean;
}

export type BookingAnswer = 'accept' | 'decline' | 'release';

/** The sessions Deaf users have booked that are still to come. Quietly empty if they cannot be loaded. */
export function useBookedSessions() {
  const [bookings, setBookings] = useState<BookedSession[]>([]);
  const [round, setRound] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<ApiBooking[]>('/api/v1/interpreters/booked-sessions/').then(
      (data) => {
        if (cancelled || !Array.isArray(data)) return;
        setBookings(
          data.map((b) => ({
            id: b.id,
            withName: b.deaf_name,
            photo: photoSrc(b.deaf_photo),
            typeLabel: b.session_type_label,
            startsAt: `${b.date}T${b.time}`,
            durationMinutes: b.duration,
            offered: b.my_state === 'offered',
            canJoin: b.can_join === true,
            confirmed: b.my_state ? b.my_state === 'confirmed' : b.status === 'CONFIRMED',
          })),
        );
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [round]);

  /** Accept or decline an offer, or give back a confirmed session; then reload the list. */
  const answer = useCallback(async (id: number, what: BookingAnswer) => {
    setBusyId(id);
    setError(null);
    try {
      await api(`/api/v1/interpreters/booked-sessions/${id}/${what}/`, { method: 'POST' });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
      setRound((n) => n + 1);
    }
  }, []);

  return { bookings, answer, busyId, error };
}

/** The first booking that is not still waiting for an answer, or null. The server sends them soonest first. */
export const upcomingBooking = (bookings: BookedSession[]) =>
  bookings.find((b) => !b.offered) ?? null;

/** Opens the call for a booking and returns the live session both people join. */
export async function startBookedCall(id: number) {
  const started = await api<{ request_id: number }>(
    `/api/v1/interpreters/sessions/booked/${id}/start/`,
    { method: 'POST' },
  );
  return started.request_id;
}
