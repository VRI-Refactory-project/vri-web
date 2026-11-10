import { api } from './api';

export interface RealtimeTicket {
  ticket: string;
  expires_in: number;
}

/** A one-minute ticket for opening a session WebSocket (POST /api/v1/realtime/ticket/). */
export const getRealtimeTicket = () =>
  api<RealtimeTicket>('/api/v1/realtime/ticket/', { method: 'POST' });
