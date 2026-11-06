import { api } from './api';
import type { CallToken } from './callToken';

/** What the guest's lobby page asks every few seconds (V2-012). */
export interface GuestLobbyStatus {
  /** True once the interpreter is connected to the call, so the guest can join. */
  interpreter_here: boolean;
}

/**
 * The guest has no account: the secret token in the emailed link is their key.
 * 404 = the link is not valid, 410 = the session ended or the guest was removed.
 */
export const getGuestLobby = (token: string) =>
  api<GuestLobbyStatus>(`/api/v1/requests/guest/${encodeURIComponent(token)}/`);

/** Enters the live session. 409 until the interpreter is in the call. */
export const joinAsGuest = (token: string) =>
  api<CallToken>(`/api/v1/requests/guest/${encodeURIComponent(token)}/join/`, {
    method: 'POST',
  });
