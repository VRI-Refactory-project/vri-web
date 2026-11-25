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
  /** V2-051: true while the booker can still cancel or move it (before change_deadline). */
  can_change?: boolean;
  /** The last moment it can be cancelled or moved (ISO date-time). */
  change_deadline?: string;
  /** The notice rule (Clarification C-04): changes allowed up to this many hours before the start. */
  change_notice_hours?: number;
}

/** What moving a booking sends: the new date ("2026-12-01"), time ("10:00") and length in minutes. */
export interface BookingChange {
  date: string;
  time: string;
  duration: number;
}

const bookingUrl = (id: number, action: 'cancel' | 'reschedule') =>
  `/api/v1/interpreters/sessions/booked/${id}/${action}/`;

/** Cancel a booking (V2-051). Returns it as the server now has it. */
export const cancelBooking = (id: number) =>
  api<MyBooking>(bookingUrl(id, 'cancel'), { method: 'POST' });

/** Move a booking to another time (V2-051). Returns it as the server now has it. */
export const rescheduleBooking = (id: number, change: BookingChange) =>
  api<MyBooking>(bookingUrl(id, 'reschedule'), { method: 'POST', body: JSON.stringify(change) });

const shortWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "Changes are allowed up to 24 hours before a session starts." (WEB-02) */
export function noticeRule(booking: MyBooking) {
  const hours = booking.change_notice_hours ?? 24;
  return hours > 0
    ? `Bookings can be cancelled or changed up to ${hours} hour${hours === 1 ? '' : 's'} before they start.`
    : 'Bookings can be cancelled or changed until they start.';
}

/** "You can change this booking until Thu 4 Dec, 10:00." or why it can no longer be changed. */
export function deadlineNote(booking: MyBooking) {
  if (booking.can_change === false) {
    return 'This booking starts too soon to be cancelled or changed in the app. Contact support if you need help.';
  }
  return booking.change_deadline
    ? `You can cancel or change this booking until ${shortWhen(booking.change_deadline)}.`
    : '';
}

const startOf = (b: MyBooking) => new Date(`${b.date}T${b.time}`).getTime();

/** The planned start has passed. */
export const hasStarted = (b: MyBooking, now = Date.now()) => startOf(b) <= now;

/** The planned end has passed, with the 15 minutes the call can still be opened after it. */
export const hasEnded = (b: MyBooking, now = Date.now()) =>
  startOf(b) + (b.duration + 15) * 60_000 < now;

/** What a booking's badge says: who is coming, that nobody has taken it, or what went wrong. */
export function bookingLabel(booking: MyBooking) {
  if (booking.no_show === 'interpreter') return 'Interpreter did not join';
  if (booking.no_show === 'booker') return 'You did not join';
  if (booking.no_show === 'both') return 'Missed';
  if (booking.status === 'CONFIRMED') {
    return booking.interpreter_name ? `Confirmed with ${booking.interpreter_name}` : 'Confirmed';
  }
  if (booking.status === 'PENDING') {
    return hasStarted(booking) ? 'No interpreter found' : 'Waiting for an interpreter';
  }
  return booking.status.charAt(0) + booking.status.slice(1).toLowerCase();
}

/** The sessions the signed-in person booked, with opening the call and cancelling. */
export function useMyBookings(onJoined: (requestId: number) => void) {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  /** Put the server's copy of a booking in the list, after it was cancelled or moved. */
  const replace = useCallback((updated: MyBooking) => {
    setBookings((list) =>
      list
        .map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
        .sort((a, b) => startOf(a) - startOf(b)),
    );
  }, []);

  return { bookings, error, join, replace };
}
