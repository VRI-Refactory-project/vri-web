// src/services/institutions.ts
import { api } from './api';

export type InstitutionProfile = {
  name: string;
  email: string;
  phone: string;
  type: string;
  description: string;
};

export type InstitutionDepartment = { id: string; name: string; active: boolean };
const MY_PROFILE = '/api/v1/institutions/me/institution-profile/';
const MY_DEPARTMENTS = '/api/v1/institutions/me/departments/';
const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const textOf = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string') ?? '';
const idOf = (...values: unknown[]) => {
  const value = values.find(
    (candidate) =>
      (typeof candidate === 'string' && candidate.length > 0) || typeof candidate === 'number',
  );
  return value === undefined ? '' : String(value);
};

function profileFrom(value: unknown): InstitutionProfile {
  const raw = recordOf(value);
  return {
    name: textOf(raw.organisation_name, raw.organization_name, raw.institution_name, raw.name),
    email: textOf(raw.email, raw.contact_email, raw.official_email),
    phone: textOf(raw.phone_number, raw.phone, raw.contact_phone),
    type: textOf(raw.organisation_type, raw.organization_type, raw.institution_type, raw.type),
    description: textOf(raw.description),
  };
}

function departmentsFrom(value: unknown): InstitutionDepartment[] {
  const outer = recordOf(value);
  const rows = Array.isArray(value)
    ? value
    : (['results', 'departments', 'data', 'items'].map((key) => outer[key]).find(Array.isArray) ??
      []);
  return rows
    .map((item) => {
      const raw = recordOf(item);
      return {
        id: idOf(raw.id, raw.uuid, raw.pk, raw.department_id, raw.department_uuid),
        name: textOf(raw.name, raw.department_name, raw.title),
        active: raw.is_active !== false && raw.active !== false && raw.status !== 'INACTIVE',
      };
    })
    .filter((department) => department.name);
}

export async function fetchMyInstitutionProfile(): Promise<InstitutionProfile> {
  return profileFrom(await api<unknown>(MY_PROFILE));
}

export async function updateMyInstitutionProfile(
  profile: InstitutionProfile,
): Promise<InstitutionProfile> {
  return profileFrom(
    await api<unknown>(MY_PROFILE, {
      method: 'PATCH',
      body: JSON.stringify({
        organisation_name: profile.name.trim(),
        organisation_type: profile.type,
        email: profile.email.trim(),
        phone_number: profile.phone.trim(),
        description: profile.description.trim(),
      }),
    }),
  );
}

export async function fetchMyDepartments(): Promise<InstitutionDepartment[]> {
  return departmentsFrom(await api<unknown>(MY_DEPARTMENTS));
}

export async function createMyDepartment(name: string): Promise<InstitutionDepartment> {
  const raw = recordOf(
    await api<unknown>(MY_DEPARTMENTS, {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    }),
  );
  return departmentsFrom([raw])[0];
}

export async function renameMyDepartment(id: string, name: string): Promise<InstitutionDepartment> {
  const raw = recordOf(
    await api<unknown>(`${MY_DEPARTMENTS}${encodeURIComponent(id)}/`, {
      method: 'PATCH',
      body: JSON.stringify({ name: name.trim() }),
    }),
  );
  return departmentsFrom([raw])[0];
}

export async function deleteMyDepartment(id: string): Promise<void> {
  await api(`${MY_DEPARTMENTS}${encodeURIComponent(id)}/`, { method: 'DELETE' });
}

export type InstitutionStatus = 'approved' | 'pending' | 'rejected' | 'deactivated';

export interface InstitutionDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  issuingAuthority: string;
  uploadedAt: string;
}

export type VerificationStage = 'completed' | 'in_progress' | 'not_started';

export interface InstitutionVerificationProgress {
  institutionDetails: VerificationStage;
  documents: VerificationStage;
  verificationChecks: VerificationStage;
  approvalDecision: VerificationStage;
}

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
  verification_document?: string; // ADDED: Holds the URL of the uploaded PDF
  contactName: string;
  address: string;
  website: string;
  description: string;
  foundedDate: string;
  lastActive: string;
  documents: InstitutionDocument[];
  verificationProgress: InstitutionVerificationProgress;
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

  if (rawStatus === 'rejected') return 'rejected';

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

function normalizeStage(value: unknown): VerificationStage | undefined {
  const stage = stringValue(value)
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (['completed', 'complete', 'done', 'verified'].includes(stage)) return 'completed';
  if (['in_progress', 'in_review', 'reviewing', 'pending'].includes(stage)) return 'in_progress';
  if (['not_started', 'not_started_yet', 'incomplete'].includes(stage)) return 'not_started';
  return undefined;
}

function normalizeDocuments(record: RawRecord): InstitutionDocument[] {
  const rawValue =
    record.documents ??
    record.verification_documents ??
    record.document ??
    record.verification_document;
  const rows = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
  return rows.flatMap((value, index) => {
    const doc = asRecord(value);
    const url =
      (typeof value === 'string' ? value : '') ||
      stringValue(
        doc.file_url,
        doc.document_url,
        doc.download_url,
        doc.file_path,
        doc.url,
        doc.file,
        doc.verification_document,
      );
    if (!url) return [];
    return [
      {
        id: stringValue(doc.id, doc.uuid, doc.pk) || String(index),
        name:
          stringValue(doc.file_name, doc.original_filename, doc.name, doc.title) ||
          `Document ${index + 1}`,
        type: stringValue(doc.document_type, doc.type, doc.category),
        url,
        issuingAuthority: stringValue(doc.issuing_authority),
        uploadedAt: stringValue(doc.uploaded_at, doc.created_at, doc.created),
      },
    ];
  });
}

function normalizeInstitution(value: unknown): Institution {
  const record = asRecord(value);
  const contact = asRecord(record.contact_person ?? record.contact ?? record.user ?? record.owner);
  const documents = normalizeDocuments(record);
  const rawProgress = asRecord(record.verification_progress ?? record.progress);
  const status = normalizeStatus(record);
  const hasRegistrationDetails = Boolean(
    stringValue(record.name, record.institution_name, record.organisation_name) &&
    stringValue(record.email, record.contact_email, record.official_email) &&
    stringValue(record.phone, record.phone_number, record.contact_phone, record.contact_number) &&
    stringValue(
      record.organisation_type,
      record.organization_type,
      record.institution_type,
      record.type,
    ) &&
    stringValue(
      record.contact_person_name,
      record.contact_name,
      contact.full_name,
      contact.name,
      record.full_name,
    ),
  );
  const detailsProgress =
    normalizeStage(rawProgress.institution_details ?? rawProgress.details) ??
    (hasRegistrationDetails ? 'completed' : 'not_started');
  const documentsProgress =
    normalizeStage(rawProgress.documents) ?? (documents.length ? 'completed' : 'not_started');
  const checksProgress =
    normalizeStage(rawProgress.verification_checks ?? rawProgress.checks) ?? 'not_started';
  const decisionProgress =
    normalizeStage(rawProgress.approval_decision ?? rawProgress.decision) ??
    (status === 'approved' || status === 'rejected' ? 'completed' : 'not_started');

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
    status,
    createdAt: stringValue(
      record.created_at,
      record.createdAt,
      record.date_created,
      record.registered_at,
    ),
    createdBy: stringValue(record.created_by_name, record.created_by, record.createdBy) || 'Admin',
    verification_document: stringValue(record.verification_document) || undefined, // ADDED: Map the URL from the backend
    contactName: stringValue(
      record.contact_person_name,
      record.contact_name,
      contact.full_name,
      contact.name,
      record.full_name,
    ),
    address: stringValue(record.address, record.physical_address, record.location),
    website: stringValue(record.website, record.website_url),
    description: stringValue(record.description),
    foundedDate: stringValue(record.founded_date, record.established_at),
    lastActive: stringValue(record.last_active, record.last_active_at, contact.last_login),
    documents,
    verificationProgress: {
      institutionDetails: detailsProgress,
      documents: documentsProgress,
      verificationChecks: checksProgress,
      approvalDecision: decisionProgress,
    },
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

export async function rejectInstitution(id: string, reason: string): Promise<Institution> {
  const response = await api<unknown>(`${BASE}${encodeURIComponent(id)}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: reason }),
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
