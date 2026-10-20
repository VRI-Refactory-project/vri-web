import { api } from './api';
import { mockCancel, mockCreate, mockGet } from './sessionRequests.mock';

/**
 * Where a live-session request is in its life. These are the states of the backend state machine
 * (V2-009); the screens only decide what to show from this value.
 */
export type SessionRequestState =
  | 'CREATED'
  | 'QUEUED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'CONNECTING'
  | 'ACTIVE'
  | 'FAILED'
  | 'CANCELLED'
  | 'COMPLETED';

/** The interpreter who accepted the request. Only present from ACCEPTED onwards. */
export interface MatchedInterpreter {
  name: string;
  /** e.g. "Ugandan Sign Language ⇄ English" */
  languages?: string;
}

export interface SessionRequest {
  id: string;
  state: SessionRequestState;
  createdAt: string;
  interpreter?: MatchedInterpreter;
}

/** States after which nothing more will change, so polling can stop. */
export const FINAL_STATES: SessionRequestState[] = ['FAILED', 'CANCELLED', 'COMPLETED'];

// PROPOSED CONTRACT. These endpoints are what we proposed to the backend (Zipporah, V2-009);
// change this file, and nothing else, if the final API differs.
const BASE = '/api/v1/sessions/requests/';

interface ApiSessionRequest {
  id: number | string;
  state: SessionRequestState;
  created_at: string;
  interpreter?: MatchedInterpreter | null;
}

function fromApi(raw: ApiSessionRequest): SessionRequest {
  return {
    id: String(raw.id),
    state: raw.state,
    createdAt: raw.created_at,
    interpreter: raw.interpreter ?? undefined,
  };
}

// Set VITE_MOCK_SESSION_REQUESTS=true in .env.local to try the screens before the API exists.
const mockEnabled = () => import.meta.env.VITE_MOCK_SESSION_REQUESTS === 'true';

/** Asks for a live video session. The server answers 409 if one is already open. */
export async function createSessionRequest(): Promise<SessionRequest> {
  if (mockEnabled()) return mockCreate();
  const raw = await api<ApiSessionRequest>(BASE, {
    method: 'POST',
    body: JSON.stringify({ channel: 'VIDEO' }),
  });
  return fromApi(raw);
}

export async function getSessionRequest(id: string): Promise<SessionRequest> {
  if (mockEnabled()) return mockGet(id);
  return fromApi(await api<ApiSessionRequest>(`${BASE}${id}/`));
}

export async function cancelSessionRequest(id: string): Promise<SessionRequest> {
  if (mockEnabled()) return mockCancel(id);
  const raw = await api<ApiSessionRequest>(`${BASE}${id}/cancel/`, { method: 'POST' });
  return fromApi(raw);
}
