import { api } from './api';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'rerouted';

export interface InterpreterOffer {
  id: string;
  title: string;
  institutionName: string;
  sector: string;
  language: string;
  participants: string;
  expiresAt: string;
}

interface ApiOffer {
  id?: string | number;
  title?: string;
  session_title?: string;
  institution?: string;
  institution_name?: string;
  organisation_name?: string;
  sector?: string;
  language?: string;
  required_language?: string;
  participants?: string | number;
  participants_summary?: string;
  participant_count?: number;
  expires_at?: string;
  response_deadline?: string;
  deadline?: string;
}

interface ApiOfferState {
  status?: OfferStatus;
}

interface ApiOffersEnvelope {
  results?: ApiOffer[];
  offers?: ApiOffer[];
}

function toStr(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function toIso(value: unknown): string {
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(Date.now() + 180 * 1000).toISOString();
}

function normalizeOffer(raw: ApiOffer): InterpreterOffer {
  const participants = toStr(raw.participants, raw.participants_summary);
  return {
    id: toStr(raw.id),
    title: toStr(raw.title, raw.session_title) || 'Interpreting request',
    institutionName:
      toStr(raw.institution_name, raw.institution, raw.organisation_name) || 'Institution',
    sector: toStr(raw.sector),
    language: toStr(raw.language, raw.required_language),
    participants:
      participants || (raw.participant_count ? `${raw.participant_count} participants` : ''),
    expiresAt: toIso(raw.expires_at ?? raw.response_deadline ?? raw.deadline),
  };
}

function unwrapList(value: unknown): ApiOffer[] {
  if (Array.isArray(value)) return value as ApiOffer[];
  if (value && typeof value === 'object') {
    const env = value as ApiOffersEnvelope;
    if (Array.isArray(env.results)) return env.results;
    if (Array.isArray(env.offers)) return env.offers;
  }
  return [];
}

export const offersApi = {
  async getOffers(): Promise<InterpreterOffer[]> {
    const raw = await api<unknown>('/api/v1/interpreters/me/offers/');
    return unwrapList(raw)
      .map(normalizeOffer)
      .filter((o) => o.id);
  },

  respondToOffer: (id: string, action: 'accept' | 'decline') => {
    return api<{ status: OfferStatus }>(`/api/v1/interpreters/me/offers/${id}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  getOfferState: (id: string) => {
    return api<ApiOfferState>(`/api/v1/interpreters/me/offers/${id}/state/`);
  },
};
