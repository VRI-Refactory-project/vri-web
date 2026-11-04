import { api } from './api';

/** What the app needs to join a session's video room (V2-011). */
export interface CallToken {
  /** Signed by the API: lets this user into this session's room and nothing else. */
  token: string;
  /** The LiveKit server to connect to. */
  url: string;
  room: string;
}

/**
 * Asks the API for permission to join a session's call. It answers 409 until an interpreter has
 * accepted, and 404 for anyone who is not on the session.
 */
export const getCallToken = (sessionId: string) =>
  api<CallToken>(`/api/v1/requests/${sessionId}/call-token/`, { method: 'POST' });
