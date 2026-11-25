import type { LiveSession } from '../../services/adminSessions';
import { getRealtimeTicket } from '../../services/realtime';

/** What the monitor hears over its live connection (V2-047, WEB-04). */
export interface LiveSessionsEvents {
  /** A call changed: its new row. A row that is no longer live means the call ended or failed. */
  onSession(session: LiveSession): void;
  /** The live connection came up (true) or dropped (false). */
  onConnectionChange(connected: boolean): void;
}

export interface LiveSessionsSocket {
  close(): void;
}

/** Opens the monitor's live connection. The page can be given a fake in tests. */
export type OpenLiveSessionsSocket = (events: LiveSessionsEvents) => LiveSessionsSocket;

// Close codes from the API (apps/realtime/consumers.py): 4401 get a new ticket, 4403 stop trying.
const CLOSE_NOT_ALLOWED = 4403;
const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

interface Deps {
  fetchTicket: () => Promise<{ ticket: string }>;
  createWebSocket: (url: string) => WebSocket;
  /** ws:// or wss:// address of the API, without a trailing slash. */
  baseUrl: string;
}

/**
 * Builds the function that opens ws/admin/sessions/. It asks for a fresh ticket every time it
 * connects and reconnects on its own when the connection drops, waiting longer each time. While it
 * is down the page keeps refreshing on a timer, so nothing is missed.
 */
export function createLiveSessionsSocketOpener(deps: Deps): OpenLiveSessionsSocket {
  return (events) => {
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
        `${deps.baseUrl}/ws/admin/sessions/?ticket=${encodeURIComponent(ticket)}`,
      );
      socket = ws;
      ws.onmessage = (message) => {
        let data: { type?: string; session?: LiveSession };
        try {
          data = JSON.parse(String(message.data));
        } catch {
          return;
        }
        if (data.type === 'live_sessions.ready') {
          delay = FIRST_RETRY_MS;
          events.onConnectionChange(true);
        } else if (data.type === 'live_session.updated' && data.session) {
          events.onSession(data.session);
        }
      };
      ws.onclose = (event) => {
        if (closed) return;
        events.onConnectionChange(false);
        if (event.code === CLOSE_NOT_ALLOWED) return;
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
export const openLiveSessionsSocket = createLiveSessionsSocketOpener({
  fetchTicket: getRealtimeTicket,
  createWebSocket: (url) => new WebSocket(url),
  baseUrl: apiBase.replace(/^http/, 'ws'),
});
