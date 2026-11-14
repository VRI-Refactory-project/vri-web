import { useEffect, useState } from 'react';
import { api } from '../../services/api';
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
  confirmed: boolean;
}

/** The sessions Deaf users have booked that are still to come. Quietly empty if they cannot be loaded. */
export function useBookedSessions() {
  const [bookings, setBookings] = useState<BookedSession[]>([]);

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
            confirmed: b.status === 'CONFIRMED',
          })),
        );
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { bookings };
}

/** The booking that comes first, or null. The server already sends them soonest first. */
export const upcomingBooking = (bookings: BookedSession[]) => bookings[0] ?? null;
