import { useEffect, useState } from 'react';
import { api, describeError } from '../../services/api';

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
  /** Display amount, e.g. "UGX 245k". The card is hidden when this is missing. */
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
  // TODO: sample amount only. There is no earnings endpoint yet, so this is not real money.
  pendingEarnings: 'UGX 245k',
  recentSessions: [
    { id: '1', title: 'General Interpreting', client: 'Muyenga Health Clinic', time: '11:42am' },
    { id: '2', title: 'Video relay', client: 'Kampala Referral Hospital', time: '10:15am' },
  ],
  nextSession: { startsAt: '14:00' },
};

export function useInterpreterHome(): { data: InterpreterHome } {
  return { data: SAMPLE_HOME };
}

/** Why an approved or unapproved interpreter cannot be offered a request right now. */
export type UnavailableReason = 'not_approved' | 'switched_off' | 'day_off' | 'outside_hours';

/** GET/PATCH /api/v1/interpreters/me/availability/status/ (V2-021). */
interface AvailabilityStatus {
  /** The dashboard switch. */
  is_available: boolean;
  /** Switch AND schedule: can she be offered a request at this very moment. */
  available_now: boolean;
  reason: UnavailableReason | null;
}

const STATUS_PATH = '/api/v1/interpreters/me/availability/status/';

/** Plain-language explanation shown when the switch is on but she still cannot get requests. */
export function reasonText(reason: UnavailableReason | null): string {
  switch (reason) {
    case 'not_approved':
      return 'Your profile is not approved yet.';
    case 'day_off':
      return 'You are switched on, but today is a day off in your schedule.';
    case 'outside_hours':
      return 'You are switched on, but it is outside your working hours.';
    default:
      return '';
  }
}

/**
 * Availability toggle (V2-021), using the dashboard status endpoint.
 *
 * `available` is the switch itself. `reason` explains why requests are not coming even though
 * the switch is on (day off, outside working hours). The switch changes straight away and goes
 * back if the API refuses, for example while the profile is not approved yet (the API's own
 * message is shown). Until the status has loaded the switch is off and cannot be used.
 */
export function useAvailability() {
  const [available, setAvailableState] = useState(false);
  const [reason, setReason] = useState<UnavailableReason | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<AvailabilityStatus>(STATUS_PATH).then(
      (status) => {
        if (cancelled) return;
        setAvailableState(status.is_available);
        setReason(status.reason);
        setLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(describeError(err));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const setAvailable = async (next: boolean) => {
    const previous = available;
    setAvailableState(next);
    setSaving(true);
    setError('');
    try {
      const status = await api<AvailabilityStatus>(STATUS_PATH, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: next }),
      });
      setAvailableState(status.is_available);
      setReason(status.reason);
    } catch (err) {
      setAvailableState(previous);
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return { available, reason, setAvailable, loading, saving, error };
}
