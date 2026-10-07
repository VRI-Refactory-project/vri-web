import { api } from './api';
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

export type Specialisation = 'GENERAL' | 'MEDICAL' | 'LEGAL';

export interface InterpreterRegistration {
  name: string;
  phone: string;
  email: string;
  password: string;
  specialisation?: Specialisation;
}

export type OrganisationType = 'HOSPITAL' | 'COURT' | 'GOVERNMENT' | 'OTHER';

export interface InstitutionRegistration {
  name: string;
  phone: string;
  email: string;
  password: string;
  organisationName: string;
  organisationType: OrganisationType;
}

async function register(path: string, body: Record<string, unknown>): Promise<AuthSession> {
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
    phone_number: d.phone.trim(),
    password: d.password,
    ...optional(d.email),
  });

export const registerInterpreter = (d: InterpreterRegistration) =>
  register('interpreter', {
    full_name: d.name.trim(),
    phone_number: d.phone.trim(),
    email: d.email.trim(),
    password: d.password,
    ...(d.specialisation ? { specialisation: d.specialisation } : {}),
  });

export const registerInstitution = (d: InstitutionRegistration) =>
  register('institution', {
    full_name: d.name.trim(),
    phone_number: d.phone.trim(),
    email: d.email.trim(),
    password: d.password,
    organisation_name: d.organisationName.trim(),
    organisation_type: d.organisationType,
  });
