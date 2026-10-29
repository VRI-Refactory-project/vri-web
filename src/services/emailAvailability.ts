import { api } from './api';

interface EmailAvailabilityResponse {
  available: boolean;
  detail?: string;
}

/**
 * Checks whether an email can be used during registration.
 * The backend remains responsible for enforcing uniqueness on submission.
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  const params = new URLSearchParams({ email: email.trim() });

  const result = await api<EmailAvailabilityResponse>(
    `/api/v1/auth/email/availability/?${params.toString()}`,
    { method: 'GET' },
  );

  return result.available;
}
