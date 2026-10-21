import { api } from './api';

/** A request the backend has offered to the signed-in interpreter and is waiting for an answer. */
export interface IncomingOffer {
  id: number;
  context: 'GENERAL' | 'MEDICAL' | 'LEGAL' | 'OTHER';
  description: string;
  priority: 'NORMAL' | 'EMERGENCY';
  requesterName: string;
  /** When the offer runs out and goes to the next interpreter. */
  expiresAt: string | null;
}

/** GET /api/v1/interpreters/me/requests/ (apps/service_requests: OfferedRequestSerializer). */
interface ApiOffer {
  id: number;
  specialisation_required: IncomingOffer['context'];
  description: string;
  priority: IncomingOffer['priority'];
  requester_name: string;
  expires_at: string | null;
}

export async function getIncomingOffers(): Promise<IncomingOffer[]> {
  const raw = await api<ApiOffer[]>('/api/v1/interpreters/me/requests/');
  return raw.map((o) => ({
    id: o.id,
    context: o.specialisation_required,
    description: o.description,
    priority: o.priority,
    requesterName: o.requester_name,
    expiresAt: o.expires_at,
  }));
}
