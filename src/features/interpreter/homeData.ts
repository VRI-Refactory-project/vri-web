import { useState } from 'react';

export interface CompletedSession {
  id: string;
  title: string;
  client: string;
  /** Display time, e.g. "11:42am". */
  time: string;
}

export interface NextSession {
  /** Display time, e.g. "14:00". */
  startsAt: string;
}

export interface InterpreterHome {
  availableRequests: number;
  todaysSessions: number;
  /** Shown only when the backend supplies it. There is no earnings endpoint yet. */
  pendingEarnings?: string;
  recentSessions: CompletedSession[];
  nextSession?: NextSession;
}

/**
 * Placeholder data for the interpreter home screen.
 *
 * TODO(V2-063): replace with the interpreter dashboard endpoint once it exists.
 * Keep the shape above as the contract and map the API response into it here.
 */
const SAMPLE_HOME: InterpreterHome = {
  availableRequests: 3,
  todaysSessions: 2,
  recentSessions: [
    { id: '1', title: 'General Interpreting', client: 'Muyenga Health Clinic', time: '11:42am' },
    { id: '2', title: 'Video relay', client: 'Kampala Referral Hospital', time: '10:15am' },
  ],
  nextSession: { startsAt: '14:00' },
};

export function useInterpreterHome(): { data: InterpreterHome } {
  return { data: SAMPLE_HOME };
}

/**
 * Availability toggle state.
 *
 * TODO(V2-021): persist through the availability endpoint once it exists.
 * Today the choice only lasts until the page is reloaded.
 */
export function useAvailability(initial = true) {
  const [available, setAvailable] = useState(initial);
  return { available, setAvailable };
}
