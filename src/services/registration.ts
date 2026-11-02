import { normalizePhone } from '../lib/validation';
import { checkBackendConnection } from '../lib/connectivity';
import { api, ApiError } from './api';
import { toSession, type LoginResponse } from './auth';
import type { AuthSession } from '../types';

// V2-001 / V2-002 / V2-003 / V2-005: self-registration. Each endpoint creates the account and
// answers 201 with the same payload as sign-in, so the user is signed in straight away.

export interface DeafRegistration {
  name: string;
  phone: string;
  password: string;
  /** Optional for deaf users. Without an email they cannot use password recovery. */
  email?: string;
}

/** Must match the library in the API (apps/interpreters/specialisations.py). */
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
  /** Everything the interpreter covers. */
  specialisations?: Specialisation[];
  /** Required by the API when `specialisations` includes OTHER. */
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
  /** What the institution is, in the person's own words. Only sent when the type is OTHER. */
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

// --- NEW: Institution License Upload ---

export interface InstitutionLicensePayload {
  licenseType: string;
  issuingAuthority: string;
  license: File;
}

export async function uploadInstitutionLicense(data: FormData): Promise<void> {
  await api('/api/v1/institutions/upload-license/', {
    method: 'POST',
    body: data,
    // Note: Do NOT set Content-Type header manually here.
    // The browser automatically sets it to multipart/form-data with the correct boundary
    // when you pass a FormData object as the body.
  });
}
