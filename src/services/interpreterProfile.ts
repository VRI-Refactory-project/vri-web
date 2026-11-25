import { api } from './api';

export interface InterpreterProfile {
  fullName: string;
  email: string;
  verificationStatus: string;
  available: boolean;
  specialisation: string; // GENERAL | MEDICAL | LEGAL | OTHER
  specialisationOther: string;
  languages: string[];
  yearsExperience: number | null;
}

interface ApiInterpreterProfile {
  full_name: string;
  email: string | null;
  verification_status: string;
  is_available: boolean;
  specialisation: string;
  specialisation_other: string;
  sign_languages: string[];
  years_experience: number | null;
}

const toProfile = (raw: ApiInterpreterProfile): InterpreterProfile => ({
  fullName: raw.full_name,
  email: raw.email ?? '',
  verificationStatus: raw.verification_status,
  available: raw.is_available,
  specialisation: raw.specialisation,
  specialisationOther: raw.specialisation_other,
  languages: raw.sign_languages ?? [],
  yearsExperience: raw.years_experience ?? null,
});

export async function getInterpreterProfile(): Promise<InterpreterProfile> {
  return toProfile(await api<ApiInterpreterProfile>('/api/v1/interpreters/me/'));
}

export async function updateInterpreterProfile(
  data: Partial<
    Pick<
      InterpreterProfile,
      'available' | 'specialisation' | 'specialisationOther' | 'languages' | 'yearsExperience'
    >
  >,
): Promise<InterpreterProfile> {
  const raw = await api<ApiInterpreterProfile>('/api/v1/interpreters/me/', {
    method: 'PATCH',
    body: JSON.stringify({
      ...(data.available !== undefined && { is_available: data.available }),
      ...(data.specialisation !== undefined && { specialisation: data.specialisation }),
      ...(data.specialisationOther !== undefined && {
        specialisation_other: data.specialisationOther,
      }),
      ...(data.languages !== undefined && { sign_languages: data.languages }),
      ...(data.yearsExperience !== undefined && { years_experience: data.yearsExperience }),
    }),
  });
  return toProfile(raw);
}

/** Live statistics returned by GET /api/v1/interpreters/me/profile/. */
export interface InterpreterProfileStats {
  average_rating: number | null;
  completed_sessions: number;
}

export async function getMyInterpreterProfileStats(): Promise<InterpreterProfileStats> {
  return api<InterpreterProfileStats>('/api/v1/interpreters/me/profile/');
}
