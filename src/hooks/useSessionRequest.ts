import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '../services/api';
import {
  FINAL_STATES,
  cancelSessionRequest,
  createSessionRequest,
  getSessionRequest,
  type SessionRequest,
} from '../services/sessionRequests';

/** How often to ask the server where the request is, in milliseconds. */
export const DEFAULT_POLL_MS = 3000;

/**
 * A message to show for a failed call. Some failures (for example a 404 page, or a server that
 * sends no text) arrive with an empty message, and an empty message would show nothing at all.
 */
const messageFor = (err: unknown) =>
  describeError(err).trim() || 'Something went wrong. Please try again.';

/**
 * Holds one live-session request: creates it, follows it until it reaches an end state, and lets
 * the person cancel it. The screens read `request.state` and decide what to show.
 */
export function useSessionRequest(pollMs: number = DEFAULT_POLL_MS) {
  const [request, setRequest] = useState<SessionRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumped after every poll so the next one is scheduled, whether the last one worked or not.
  const [tick, setTick] = useState(0);
  // The request the person is looking at right now. A status check that comes back for any other
  // request (for example one that was just cancelled) is ignored instead of bringing it back.
  const currentId = useRef<string | null>(null);

  const id = request?.id;
  const state = request?.state;

  useEffect(() => {
    if (!id || !state || FINAL_STATES.includes(state) || state === 'ACTIVE') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const next = await getSessionRequest(id);
        if (cancelled || currentId.current !== id) return;
        setRequest(next);
        setError(null);
      } catch (err) {
        if (!cancelled && currentId.current === id) setError(messageFor(err));
      }
      if (!cancelled) setTick((n) => n + 1);
    }, pollMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, state, tick, pollMs]);

  const start = useCallback(async (priority?: 'NORMAL' | 'EMERGENCY') => {
    setBusy(true);
    setError(null);
    try {
      const created = await createSessionRequest(priority);
      currentId.current = created.id;
      setRequest(created);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await cancelSessionRequest(id);
      currentId.current = null;
      setRequest(null);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }, [id]);

  /** Forget the current request, for example to start again after it failed. */
  const reset = useCallback(() => {
    currentId.current = null;
    setRequest(null);
    setError(null);
  }, []);

  return { request, error, busy, start, cancel, reset };
}
