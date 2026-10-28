// src/services/institutions.ts
import { api } from './api';

export type InstitutionStatus = 'approved' | 'pending' | 'deactivated';

export type InstitutionSector =
  | 'Healthcare'
  | 'Education'
  | 'Government'
  | 'Legal'
  | 'Religious'
  | 'Security'
  | 'Manufacturing'
  | 'Finance'
  | 'Other';

export interface Institution {
  id: string;
  name: string;
  registrationNumber: string;
  sector: InstitutionSector;
  email: string;
  phone: string;
  status: InstitutionStatus;
  createdAt: string;
  createdBy: string;
}

export interface InstitutionForm {
  name: string;
  registrationNumber: string;
  sector: InstitutionSector;
  email: string;
  phone: string;
  sectorOther?: string;
}

type RawRecord = Record<string, unknown>;

const BASE = '/api/v1/administration/institutions/';

function asRecord(value: unknown): RawRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawRecord)
    : {};
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }
  return '';
}

function normalizeSector(value: unknown): InstitutionSector {
  const sector = stringValue(value).trim().toLowerCase();

  const known: Record<string, InstitutionSector> = {
    healthcare: 'Healthcare',
    health: 'Healthcare',
    hospital: 'Healthcare',
    education: 'Education',
    school: 'Education',
    government: 'Government',
    public: 'Government',
    legal: 'Legal',
    law: 'Legal',
    religious: 'Religious',
    religion: 'Religious',
    security: 'Security',
    police: 'Security',
    manufacturing: 'Manufacturing',
    finance: 'Finance',
    financial: 'Finance',
    other: 'Other',
  };

  return known[sector] ?? 'Other';
}

function normalizeStatus(record: RawRecord): InstitutionStatus {
  const rawStatus = stringValue(record.status, record.account_status, record.verification_status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    record.is_active === false ||
    record.is_active === 0 ||
    record.active === false ||
    rawStatus === 'deactivated' ||
    rawStatus === 'inactive' ||
    rawStatus === 'disabled' ||
    rawStatus === 'suspended' ||
    rawStatus === 'rejected'
  ) {
    return 'deactivated';
  }

  if (
    rawStatus === 'approved' ||
    rawStatus === 'verified' ||
    rawStatus === 'active' ||
    record.is_verified === true ||
    record.is_approved === true
  ) {
    return 'approved';
  }

  return 'pending';
}

function normalizeInstitution(value: unknown): Institution {
  const record = asRecord(value);

  return {
    id: stringValue(record.id, record.uuid, record.pk),
    name: stringValue(
      record.name,
      record.institution_name,
      record.organisation_name,
      record.organization_name,
    ),
    registrationNumber: stringValue(
      record.registration_number,
      record.registrationNumber,
      record.registration_no,
      record.reg_number,
      record.reg_no,
    ),
    sector: normalizeSector(record.sector ?? record.industry ?? record.institution_type),
    email: stringValue(record.email, record.contact_email, record.official_email),
    phone: stringValue(
      record.phone,
      record.phone_number,
      record.contact_phone,
      record.contact_number,
    ),
    status: normalizeStatus(record),
    createdAt: stringValue(
      record.created_at,
      record.createdAt,
      record.date_created,
      record.registered_at,
    ),
    createdBy: stringValue(record.created_by_name, record.created_by, record.createdBy) || 'Admin',
  };
}

function unwrapList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  for (const key of ['results', 'institutions', 'data', 'items']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function toPayload(form: InstitutionForm) {
  return {
    name: form.name,
    registration_number: form.registrationNumber,
    sector: form.sector.toLowerCase(),
    ...(form.sector === 'Other' && form.sectorOther?.trim()
      ? { sector_other: form.sectorOther.trim() }
      : {}),
    email: form.email,
    phone: form.phone,
  };
}

/* ---------- Read ---------- */

export async function fetchInstitutions(): Promise<Institution[]> {
  const response = await api<unknown>(BASE);
  return unwrapList(response).map(normalizeInstitution);
}

export async function fetchInstitution(id: string): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/`);
  return normalizeInstitution(response);
}

/* ---------- Create / update ---------- */

export async function createInstitution(form: InstitutionForm): Promise<Institution> {
  const response = await api<unknown>(BASE, {
    method: 'POST',
    body: JSON.stringify(toPayload(form)),
  });
  return normalizeInstitution(response);
}

export async function updateInstitution(id: string, form: InstitutionForm): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(form)),
  });
  return normalizeInstitution(response);
}

/* ---------- Status actions ---------- */

export async function approveInstitution(id: string): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/approve/`, {
    method: 'POST',
  });
  return normalizeInstitution(response);
}

export async function rejectInstitution(id: string): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/reject/`, {
    method: 'POST',
  });
  return normalizeInstitution(response);
}

export async function deactivateInstitution(id: string): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/deactivate/`, {
    method: 'POST',
  });
  return normalizeInstitution(response);
}

/* ---------- Delete ---------- */

/** DELETE /api/v1/administration/institutions/{id}/ */
export async function deleteInstitution(id: string): Promise<void> {
  await api(`${BASE}${encodeURIComponent(id)}/`, {
    method: 'DELETE',
  });
}

/* ---------- Compatibility helper ---------- */

export async function updateInstitutionStatus(
  id: string,
  action: 'approve' | 'activate' | 'deactivate',
): Promise<Institution> {
  if (action === 'approve' || action === 'activate') return approveInstitution(id);
  return deactivateInstitution(id);
}
