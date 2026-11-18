import { useCallback, useEffect, useState } from 'react';
import { api, describeError } from '../../services/api';
import { startBookedCall } from '../interpreter/bookedSessions';

/** One item from GET /api/v1/interpreters/sessions/booked/: a session the signed-in person booked. */
export interface MyBooking {
  id: number;
  date: string; // "2026-12-01"
  time: string; // "10:00:00"
  duration: number; // minutes
  session_type: string;
  status: string;
  interpreter_name?: string | null;
  /** True from 10 minutes before the start: the call can be opened. */
  can_join?: boolean;
  /** Set when someone did not turn up: "interpreter", "booker" or "both". */
  no_show?: '' | 'interpreter' | 'booker' | 'both';
}

/** What a booking's badge says: who is coming, that nobody has taken it, or what went wrong. */
export function bookingLabel(booking: MyBooking) {
  if (booking.no_show === 'interpreter') return 'Interpreter did not join';
  if (booking.no_show === 'booker') return 'You did not join';
  if (booking.no_show === 'both') return 'Missed';
  if (booking.status === 'CONFIRMED') {
    return booking.interpreter_name ? `Confirmed with ${booking.interpreter_name}` : 'Confirmed';
  }
  if (booking.status === 'PENDING') return 'Waiting for an interpreter';
  return booking.status.charAt(0) + booking.status.slice(1).toLowerCase();
}

/** The sessions the signed-in person booked, with opening the call and cancelling. */
export function useMyBookings(onJoined: (requestId: number) => void) {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<MyBooking[]>('/api/v1/interpreters/sessions/booked/').then(
      (data) => !cancelled && setBookings(Array.isArray(data) ? data : []),
      () => !cancelled && setBookings([]),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const join = useCallback(
    async (id: number) => {
      setError(null);
      try {
        onJoined(await startBookedCall(id));
      } catch (err) {
        setError(describeError(err));
      }
    },
    [onJoined],
  );

  const cancel = useCallback(async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await api(`/api/v1/interpreters/sessions/booked/${id}/cancel/`, { method: 'POST' });
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusyId(null);
    }
  }, []);

  return { bookings, error, busyId, join, cancel };
}
