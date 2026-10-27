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
  /** Free-text description used only when sector is 'Other'. */
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
    rawStatus === 'suspended'
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

  // Supports common Django REST Framework pagination and list wrappers.
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

/**
 * Retrieve institution records from the authenticated admin API.
 *
 * Expected response:
 * - a list of records, or
 * - a DRF paginated response containing { results: [...] }.
 */
export async function fetchInstitutions(): Promise<Institution[]> {
  const response = await api<unknown>(BASE);
  return unwrapList(response).map(normalizeInstitution);
}

/**
 * Create an institutional account.
 * The backend should create it in pending status and enforce permissions.
 */
export async function createInstitution(form: InstitutionForm): Promise<Institution> {
  const response = await api<unknown>(BASE, {
    method: 'POST',
    body: JSON.stringify(toPayload(form)),
  });

  return normalizeInstitution(response);
}

/**
 * Edit institution details without silently changing its status.
 */
export async function updateInstitution(id: string, form: InstitutionForm): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(form)),
  });

  return normalizeInstitution(response);
}

/**
 * Change institution approval/access status.
 *
 * The API should validate transitions and enforce administrator permissions.
 * If your backend uses a different status field or action endpoint, update this
 * request to match that backend contract.
 */
export async function updateInstitutionStatus(
  id: string,
  action: 'approve' | 'activate' | 'deactivate',
): Promise<Institution> {
  const status: InstitutionStatus =
    action === 'deactivate'
      ? 'deactivated'
      : action === 'activate' || action === 'approve'
        ? 'approved'
        : 'pending';

  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      is_active: status === 'approved',
      is_approved: status === 'approved',
    }),
  });

  return normalizeInstitution(response);
}

/** DELETE /api/v1/admin/institutions/{id}/ */
export async function deleteInstitution(id: string): Promise<void> {
  await api(`/api/v1/admin/institutions/${encodeURIComponent(id)}/`, {
    method: 'DELETE',
  });
}
