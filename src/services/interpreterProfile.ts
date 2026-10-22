import { api } from './api';

export interface InterpreterProfile {
  fullName: string;
  email: string;
  verificationStatus: string;
  available: boolean;
  specialisation: string; // GENERAL | MEDICAL | LEGAL | OTHER
  specialisationOther: string;
  languages: string[];
}

interface ApiInterpreterProfile {
  full_name: string;
  email: string | null;
  verification_status: string;
  is_available: boolean;
  specialisation: string;
  specialisation_other: string;
  sign_languages: string[];
}

const toProfile = (raw: ApiInterpreterProfile): InterpreterProfile => ({
  fullName: raw.full_name,
  email: raw.email ?? '',
  verificationStatus: raw.verification_status,
  available: raw.is_available,
  specialisation: raw.specialisation,
  specialisationOther: raw.specialisation_other,
  languages: raw.sign_languages ?? [],
});

export async function getInterpreterProfile(): Promise<InterpreterProfile> {
  return toProfile(await api<ApiInterpreterProfile>('/api/v1/interpreters/me/'));
}

export async function updateInterpreterProfile(
  data: Pick<
    InterpreterProfile,
    'available' | 'specialisation' | 'specialisationOther' | 'languages'
  >,
): Promise<InterpreterProfile> {
  const raw = await api<ApiInterpreterProfile>('/api/v1/interpreters/me/', {
    method: 'PATCH',
    body: JSON.stringify({
      is_available: data.available,
      specialisation: data.specialisation,
      specialisation_other: data.specialisationOther,
      sign_languages: data.languages,
    }),
  });
  return toProfile(raw);
}
