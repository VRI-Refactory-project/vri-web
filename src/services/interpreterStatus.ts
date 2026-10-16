import { api } from './api';

export type InterpreterStatus = 'INACTIVE' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

/** GET /api/v1/interpreters/me/ (only the field used here). */
export const getVerificationStatus = () =>
  api<{ verification_status: InterpreterStatus }>('/api/v1/interpreters/me/').then(
    (p) => p.verification_status,
  );
