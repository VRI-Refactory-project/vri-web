import { getRealtimeTicket } from '../../services/realtime';
import { toMessage, type ApiMessage, type ChatMessage } from '../../services/community';

/** What the page hears from the server about its chats (apps/community/events.py). */
export interface ChatEvents {
  /** A new message, in either conversation, from your own side (`mine`). */
  onMessage(connectionId: number, message: ChatMessage): void;
  /** The sender took a message back. */
  onDeleted(connectionId: number, messageId: number): void;
  /** The other person opened these messages of yours. */
  onRead(connectionId: number, messageIds: number[]): void;
  /** The socket is open (again): load what was missed while it was down. */
  onOpen(): void;
  /** The socket dropped. It keeps trying to reconnect; until then the page should ask for updates itself. */
  onClose(): void;
}

export interface ChatSocket {
  close(): void;
}

/** Opens the live chat connection. The page can be given a fake in tests. */
export type OpenChatSocket = (events: ChatEvents) => ChatSocket;

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

interface ServerEvent {
  type?: string;
  connection?: number;
  message?: ApiMessage;
  message_id?: number;
  message_ids?: number[];
}

/**
 * Builds the function that opens the chat socket. It asks for a fresh ticket every time it
 * connects and reconnects on its own when the connection drops, so a chat keeps working through
 * a bad network. It stops only when the server says this person may not listen.
 */
export function createChatSocketOpener(deps: Deps): OpenChatSocket {
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
        `${deps.baseUrl}/ws/community/?ticket=${encodeURIComponent(ticket)}`,
      );
      socket = ws;
      ws.onmessage = (message) => {
        let data: ServerEvent;
        try {
          data = JSON.parse(String(message.data));
        } catch {
          return;
        }
        if (data.type === 'community.ready') {
          delay = FIRST_RETRY_MS;
          events.onOpen();
        } else if (
          data.type === 'community.message' &&
          typeof data.connection === 'number' &&
          data.message
        ) {
          events.onMessage(data.connection, toMessage(data.message));
        } else if (
          data.type === 'community.message_deleted' &&
          typeof data.connection === 'number' &&
          typeof data.message_id === 'number'
        ) {
          events.onDeleted(data.connection, data.message_id);
        } else if (
          data.type === 'community.read' &&
          typeof data.connection === 'number' &&
          Array.isArray(data.message_ids)
        ) {
          events.onRead(data.connection, data.message_ids);
        }
      };
      ws.onclose = (event) => {
        if (closed) return;
        events.onClose();
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
export const openChatSocket = createChatSocketOpener({
  fetchTicket: getRealtimeTicket,
  createWebSocket: (url) => new WebSocket(url),
  baseUrl: apiBase.replace(/^http/, 'ws'),
});
