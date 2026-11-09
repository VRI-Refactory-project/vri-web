import { api } from './api';

/** A hearing guest the Deaf user invited to a session (V2-012). */
export interface GuestInvitation {
  id: number;
  email: string;
  phone: string;
  created_at: string;
  /** Set the first time the guest entered the call. */
  joined_at: string | null;
  /** Set when the Deaf user removed the guest: their link no longer works. */
  removed_at: string | null;
}

const base = (sessionId: string) => `/api/v1/requests/${sessionId}/invitations/`;

/** Everyone invited to this session, with whether they joined or were removed. */
export const listInvitations = (sessionId: string) => api<GuestInvitation[]>(base(sessionId));

/** Emails the guest a link. 409 until an interpreter has accepted the session. */
export const createInvitation = (sessionId: string, email: string) =>
  api<GuestInvitation>(base(sessionId), { method: 'POST', body: JSON.stringify({ email }) });

/** Stops the guest's link working and disconnects them if they are in the call. */
export const removeInvitation = (sessionId: string, invitationId: number) =>
  api<GuestInvitation>(`${base(sessionId)}${invitationId}/remove/`, { method: 'POST' });
