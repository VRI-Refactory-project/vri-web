import { api } from './api';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'rerouted';

export interface InterpreterOffer {
  id: string;
  title: string;
  institutionName: string;
  sector: string;
  language: string;
  participants: string;
  expiresAt: string; // ISO string
}

export const offersApi = {
  /** Fetches pending session requests (WEB-01) */
  getOffers: () => {
    return api<InterpreterOffer[]>('/api/v1/interpreters/me/offers/');
  },

  /** Accepts or declines a request (WEB-06) */
  respondToOffer: (id: string, action: 'accept' | 'decline') => {
    return api<{ status: OfferStatus }>(`/api/v1/interpreters/me/offers/${id}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  /** Polls the state of an offer to check if it expired or was rerouted (WEB-05, WEB-07) */
  getOfferState: (id: string) => {
    return api<{ status: OfferStatus }>(`/api/v1/interpreters/me/offers/${id}/state/`);
  },
};
