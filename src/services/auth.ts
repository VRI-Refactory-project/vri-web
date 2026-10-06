import { api } from './api';
import type { AuthSession } from '../types';

// Endpoints are placeholders until the backend contract (NEW-02, V2-008) is agreed.
export const signIn = (identifier: string, password: string) =>
  api<AuthSession>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

export const requestRecovery = (identifier: string) =>
  api<void>('/auth/recovery/', { method: 'POST', body: JSON.stringify({ identifier }) });
