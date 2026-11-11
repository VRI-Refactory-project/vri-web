import { api } from './api';

export type FeedbackCategory = 'Audio' | 'Video' | 'Other';

export interface FeedbackInput {
  /** 1 to 5. */
  rating: number;
  category?: FeedbackCategory;
  issues?: string[];
  comment?: string;
}

/** Sends one person's feedback about a finished session (V2-041). Each person can send it once. */
export function submitSessionFeedback(requestId: string, input: FeedbackInput): Promise<unknown> {
  return api(`/api/v1/realtime/requests/${requestId}/feedback/`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
