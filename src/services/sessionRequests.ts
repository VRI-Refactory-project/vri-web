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

// The live API (vri-api, V2-022). The screens keep their own state names; this file is the only
// place that knows the API's field and status names.
const BASE = '/api/v1/requests/';

/** What the API calls each status, and which screen state it maps to. */
const STATUS_TO_STATE: Record<string, SessionRequestState> = {
  PENDING: 'QUEUED',
  OFFERED: 'OFFERED',
  ASSIGNED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

interface ApiSessionRequest {
  id: number | string;
  status: string;
  created_at: string;
  /** Only filled in once an interpreter has accepted (status ASSIGNED). */
  interpreter?: MatchedInterpreter | null;
}

function fromApi(raw: ApiSessionRequest): SessionRequest {
  return {
    id: String(raw.id),
    // An unknown status is treated as still waiting, so the screen keeps polling.
    state: STATUS_TO_STATE[raw.status] ?? 'QUEUED',
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
    body: JSON.stringify({
      specialisation_required: 'GENERAL',
      priority: 'NORMAL',
      request_key: crypto.randomUUID(),
    }),
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
