import { api } from './api';

export type FeedbackCategory = 'Audio' | 'Video' | 'Other';

export interface FeedbackInput {
  /** 1 (very bad) to 5 (very good). */
  rating: number;
  category?: FeedbackCategory;
  issues?: string[];
  comment?: string;
}

/**
 * Sends one person's feedback about a finished session (V2-041). The API allows one per person
 * per session, and only once the session is completed: 409 `already_submitted` / `not_completed`.
 */
export async function submitSessionFeedback(id: string, input: FeedbackInput): Promise<void> {
  await api(`/api/v1/requests/${id}/feedback/`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
