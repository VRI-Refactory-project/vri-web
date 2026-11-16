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

/** What the session is for. The API accepts these three (its REQUEST_CONTEXTS). */
export type SessionContext = 'GENERAL' | 'MEDICAL' | 'LEGAL';

export const SESSION_CONTEXTS: { value: SessionContext; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'LEGAL', label: 'Legal' },
];

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
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

/** The screen state for a status the API (or its WebSocket) sends. Unknown ones count as waiting. */
export const toSessionState = (status: string): SessionRequestState =>
  STATUS_TO_STATE[status] ?? 'QUEUED';

interface ApiSessionRequest {
  id: number | string;
  status: string;
  /** How the call is going (V2-011). Falls back to `status` when the API does not send it. */
  display_status?: string;
  created_at: string;
  /** Only filled in once an interpreter has accepted (status ASSIGNED). */
  interpreter?: MatchedInterpreter | null;
}

function fromApi(raw: ApiSessionRequest): SessionRequest {
  return {
    id: String(raw.id),
    // An unknown status is treated as still waiting, so the screen keeps polling.
    state: toSessionState(raw.display_status ?? raw.status),
    createdAt: raw.created_at,
    interpreter: raw.interpreter ?? undefined,
  };
}

// Set VITE_MOCK_SESSION_REQUESTS=true in .env.local to try the screens before the API exists.
const mockEnabled = () => import.meta.env.VITE_MOCK_SESSION_REQUESTS === 'true';

/** Asks for a live video session. The server answers 409 if one is already open. */
export async function createSessionRequest(
  priority: 'NORMAL' | 'EMERGENCY' = 'NORMAL',
  context: SessionContext = 'GENERAL',
): Promise<SessionRequest> {
  if (mockEnabled()) return mockCreate();
  const raw = await api<ApiSessionRequest>(BASE, {
    method: 'POST',
    body: JSON.stringify({
      // Matching (V2-022) prefers interpreters with this specialisation.
      specialisation_required: context,
      priority,
      request_key: crypto.randomUUID(),
    }),
  });
  return fromApi(raw);
}

/** The person's request that is still looking for an interpreter, or null when there is none. */
export async function getOpenSessionRequest(): Promise<SessionRequest | null> {
  if (mockEnabled()) return null;
  const raw = await api<ApiSessionRequest | undefined>(`${BASE}mine/`);
  return raw ? fromApi(raw) : null;
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

/**
 * Ends the session for everyone (V2-034). The API allows only the interpreter or the person who
 * asked for the session, and answers 403 to anyone else.
 */
export async function endSession(id: string): Promise<SessionRequest> {
  return fromApi(await api<ApiSessionRequest>(`${BASE}${id}/end/`, { method: 'POST' }));
}
