import { api } from './api';
import { normalizePhone } from '../lib/validation';

interface PhoneAvailabilityResponse {
  available: boolean;
  detail?: string;
}

export async function checkPhoneAvailability(phone: string): Promise<boolean> {
  const params = new URLSearchParams({ phone: normalizePhone(phone) });

  const result = await api<PhoneAvailabilityResponse>(
    `/api/v1/auth/phone/availability/?${params.toString()}`,
    { method: 'GET' },
  );

  return result.available;
}
