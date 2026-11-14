import { normalizePhone } from '../lib/validation';
import { checkBackendConnection } from '../lib/connectivity';
import { api, ApiError } from './api';
import { toSession, type LoginResponse } from './auth';
import type { AuthSession } from '../types';

export interface DeafRegistration {
  name: string;
  phone: string;
  password: string;
  email?: string;
}

export type Specialisation =
  | 'GENERAL'
  | 'MEDICAL'
  | 'LEGAL'
  | 'EDUCATION'
  | 'RELIGIOUS'
  | 'SECURITY'
  | 'GOVERNMENT'
  | 'EMPLOYMENT'
  | 'FINANCIAL'
  | 'MENTAL_HEALTH'
  | 'SOCIAL_SERVICES'
  | 'MEDIA'
  | 'TECHNICAL'
  | 'EVENTS'
  | 'OTHER';

export interface InterpreterRegistration {
  name: string;
  phone: string;
  email: string;
  password: string;
  specialisations?: Specialisation[];
  specialisationOther?: string;
}

export type OrganisationType =
  'HOSPITAL' | 'COURT' | 'GOVERNMENT' | 'CHURCH' | 'POLICE' | 'SCHOOL' | 'OTHER';

export interface InstitutionRegistration {
  name: string;
  phone: string;
  email: string;
  password: string;
  organisationName: string;
  organisationType: OrganisationType;
  organisationTypeOther?: string;
}

async function register(path: string, body: Record<string, unknown>): Promise<AuthSession> {
  const isConnected = await checkBackendConnection();

  if (!isConnected) {
    throw new ApiError(
      0,
      'Your connection is unavailable. Please reconnect to the internet before creating your account.',
    );
  }

  const res = await api<LoginResponse>(`/api/v1/auth/register/${path}/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return toSession(res);
}

const optional = (value: string | undefined) => (value?.trim() ? { email: value.trim() } : {});

export const registerDeaf = (d: DeafRegistration) =>
  register('deaf', {
    full_name: d.name.trim(),
    phone_number: normalizePhone(d.phone),
    password: d.password,
    ...optional(d.email),
  });

export const registerInterpreter = (d: InterpreterRegistration) =>
  register('interpreter', {
    full_name: d.name.trim(),
    phone_number: normalizePhone(d.phone),
    email: d.email.trim(),
    password: d.password,
    ...(d.specialisations?.length ? { specialisations: d.specialisations } : {}),
    ...(d.specialisationOther?.trim()
      ? { specialisation_other: d.specialisationOther.trim() }
      : {}),
  });

export const registerInstitution = (d: InstitutionRegistration) =>
  register('institution', {
    full_name: d.name.trim(),
    phone_number: normalizePhone(d.phone),
    email: d.email.trim(),
    password: d.password,
    organisation_name: d.organisationName.trim(),
    organisation_type: d.organisationType,
    ...(d.organisationType === 'OTHER' && d.organisationTypeOther?.trim()
      ? { organisation_type_other: d.organisationTypeOther.trim() }
      : {}),
  });

export interface InstitutionLicensePayload {
  licenseType: string;
  issuingAuthority: string;
  license: File;
}

export async function uploadInstitutionLicense(data: FormData): Promise<void> {
  await api('/api/v1/institutions/me/document/', {
    method: 'POST',
    body: data,
  });
}
