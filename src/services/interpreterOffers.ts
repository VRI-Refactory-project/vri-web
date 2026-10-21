import { api } from './api';

/** A request the backend has offered to the signed-in interpreter and is waiting for an answer. */
export interface IncomingOffer {
  /** The offer's id, used to answer it. */
  id: string;
  title: string;
  /** Who is asking: their institution, or their name. */
  requesterName: string;
  /** The kind of interpreting needed, for example "Medical". */
  sector: string;
  emergency: boolean;
  /** When the offer runs out and goes to the next interpreter. */
  expiresAt: string | null;
}

/** GET /api/v1/interpreters/me/offers/ (apps/service_requests: InterpreterOfferSerializer). */
interface ApiOffer {
  id: string;
  title: string;
  institutionName: string;
  sector: string;
  expiresAt: string | null;
}

const BASE = '/api/v1/interpreters/me/offers/';

export async function getIncomingOffers(): Promise<IncomingOffer[]> {
  const raw = await api<ApiOffer[]>(BASE);
  return raw.map((o) => ({
    id: o.id,
    title: o.title,
    requesterName: o.institutionName,
    sector: o.sector,
    emergency: o.title.startsWith('Emergency'),
    expiresAt: o.expiresAt,
  }));
}

/** POST .../offers/<id>/respond/. Answers 409 when the offer expired or was already answered. */
export async function respondToOffer(id: string, action: 'accept' | 'decline'): Promise<void> {
  await api(`${BASE}${id}/respond/`, { method: 'POST', body: JSON.stringify({ action }) });
}
