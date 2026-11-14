import { getRealtimeTicket } from '../../services/realtime';
import {
  FINAL_STATES,
  toSessionState,
  type SessionRequestState,
} from '../../services/sessionRequests';

/** What the page hears from the server about the session it is on. */
export interface SessionEvents {
  onStatus(state: SessionRequestState): void;
}

export interface SessionSocket {
  close(): void;
}

/** Opens the live connection for one session. The page can be given a fake in tests. */
export type OpenSessionSocket = (sessionId: string, events: SessionEvents) => SessionSocket;

// Close codes from the API (apps/realtime/consumers.py): 4401 get a new ticket, 4403 stop trying.
const CLOSE_NOT_ALLOWED = 4403;
const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 15000;

interface Deps {
  fetchTicket: () => Promise<{ ticket: string }>;
  createWebSocket: (url: string) => WebSocket;
  /** ws:// or wss:// address of the API, without a trailing slash. */
  baseUrl: string;
}

/**
 * Builds the function that opens a session socket (V2-031, V2-034). It asks for a fresh ticket
 * every time it connects, reconnects on its own when the connection drops, and stops once the
 * server says the session is over or the person may not follow it.
 */
export function createSessionSocketOpener(deps: Deps): OpenSessionSocket {
  return (sessionId, events) => {
    let closed = false;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = FIRST_RETRY_MS;

    const retry = () => {
      if (closed) return;
      timer = setTimeout(() => void connect(), delay);
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    };

    const connect = async () => {
      if (closed) return;
      let ticket: string;
      try {
        ticket = (await deps.fetchTicket()).ticket;
      } catch {
        retry();
        return;
      }
      if (closed) return;

      const ws = deps.createWebSocket(
        `${deps.baseUrl}/ws/sessions/${sessionId}/?ticket=${encodeURIComponent(ticket)}`,
      );
      socket = ws;
      ws.onopen = () => {
        delay = FIRST_RETRY_MS;
      };
      ws.onmessage = (message) => {
        let data: { type?: string; status?: string };
        try {
          data = JSON.parse(String(message.data));
        } catch {
          return;
        }
        if (data.type !== 'session.status' || typeof data.status !== 'string') return;
        const state = toSessionState(data.status);
        events.onStatus(state);
        if (FINAL_STATES.includes(state)) {
          // Nothing more will change, so stop listening.
          closed = true;
          ws.close();
        }
      };
      ws.onclose = (event) => {
        if (closed || event.code === CLOSE_NOT_ALLOWED) return;
        retry();
      };
    };

    void connect();
    return {
      close() {
        closed = true;
        clearTimeout(timer);
        socket?.close();
      },
    };
  };
}

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

/** The real socket: http becomes ws, https becomes wss. */
export const openSessionSocket = createSessionSocketOpener({
  fetchTicket: getRealtimeTicket,
  createWebSocket: (url) => new WebSocket(url),
  baseUrl: apiBase.replace(/^http/, 'ws'),
});
