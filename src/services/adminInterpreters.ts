import { api } from './api';

/** Statuses of an interpreter's verification, as the API names them (V2-045). */
export type VerificationStatus = 'INACTIVE' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

export interface InterpreterRow {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  status: VerificationStatus;
  specialisation: string | null;
  certificationCount: number;
  createdAt: string;
}

export interface Certificate {
  id: number;
  documentName: string;
  certificateType: string;
  issuingOrganisation: string;
  uploadedAt: string;
  rejectionReason: string;
  /** The protected download endpoint. Needs the admin's token, so it is fetched, not linked. */
  fileUrl: string;
}

export interface Decision {
  id: number;
  action: string;
  reason: string;
  adminName: string;
  createdAt: string;
}

export interface InterpreterDetail extends InterpreterRow {
  isAvailable: boolean;
  certificates: Certificate[];
  decisions: Decision[];
}

interface ApiRow {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  verification_status: VerificationStatus;
  specialisation: string | null;
  certification_count: number;
  created_at: string;
}

interface ApiDetail extends ApiRow {
  is_available: boolean;
  certifications: {
    id: number;
    document_name: string;
    certificate_type: string;
    issuing_organisation: string;
    uploaded_at: string;
    rejection_reason: string;
    file_url: string;
  }[];
  decisions: {
    id: number;
    action: string;
    reason: string;
    admin_name: string;
    created_at: string;
  }[];
}

const BASE = '/api/v1/manage/interpreters/';

const toRow = (r: ApiRow): InterpreterRow => ({
  id: r.id,
  userId: r.user_id,
  fullName: r.full_name,
  phoneNumber: r.phone_number,
  email: r.email ?? '',
  status: r.verification_status,
  specialisation: r.specialisation,
  certificationCount: r.certification_count,
  createdAt: r.created_at,
});

const toDetail = (r: ApiDetail): InterpreterDetail => ({
  ...toRow(r),
  isAvailable: r.is_available,
  certificates: r.certifications.map((c) => ({
    id: c.id,
    documentName: c.document_name,
    certificateType: c.certificate_type,
    issuingOrganisation: c.issuing_organisation,
    uploadedAt: c.uploaded_at,
    rejectionReason: c.rejection_reason,
    fileUrl: c.file_url,
  })),
  decisions: r.decisions.map((d) => ({
    id: d.id,
    action: d.action,
    reason: d.reason,
    adminName: d.admin_name,
    createdAt: d.created_at,
  })),
});

/** The verification queue, oldest first. Pass a status to filter, or nothing for everyone. */
export async function listInterpreters(status?: VerificationStatus): Promise<InterpreterRow[]> {
  const query = status ? `?status=${status}` : '';
  return (await api<ApiRow[]>(`${BASE}${query}`)).map(toRow);
}

export async function getInterpreter(id: number | string): Promise<InterpreterDetail> {
  return toDetail(await api<ApiDetail>(`${BASE}${id}/`));
}

export type Decide = 'approve' | 'reject' | 'deactivate' | 'reactivate';

/** Approve, reject, deactivate or reactivate. Reject and deactivate need a reason. */
export async function decideInterpreter(
  id: number | string,
  action: Decide,
  reason = '',
): Promise<InterpreterDetail> {
  return toDetail(
    await api<ApiDetail>(`${BASE}${id}/${action}/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  );
}

const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Fetches a certificate through the protected endpoint (it needs the admin's token, so a plain
 * link would not work) and returns a temporary browser URL for it. The caller opens or downloads
 * it and should revoke it afterwards.
 */
export async function certificateBlobUrl(fileUrl: string, token: string): Promise<string> {
  // The API sends an absolute URL; only its path is used so it always goes to the configured API.
  const path = new URL(fileUrl, API_ORIGIN).pathname;
  const res = await fetch(`${API_ORIGIN}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not open the certificate.');
  return URL.createObjectURL(await res.blob());
}
