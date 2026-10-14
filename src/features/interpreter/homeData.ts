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

/** The part of GET/PATCH /api/v1/interpreters/me/ used by the availability toggle. */
interface ProfileAvailability {
  is_available: boolean;
}

const PROFILE_PATH = '/api/v1/interpreters/me/';

/**
 * Availability toggle (V2-021), kept on the interpreter profile in the API.
 *
 * The switch changes straight away and goes back if the API refuses, for example while the
 * profile is not approved yet (the API's own message is shown). Until the profile has loaded
 * the switch is off and cannot be used.
 */
export function useAvailability() {
  const [available, setAvailableState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<ProfileAvailability>(PROFILE_PATH).then(
      (profile) => {
        if (cancelled) return;
        setAvailableState(profile.is_available);
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
      const profile = await api<ProfileAvailability>(PROFILE_PATH, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: next }),
      });
      setAvailableState(profile.is_available);
    } catch (err) {
      setAvailableState(previous);
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return { available, setAvailable, loading, saving, error };
}
