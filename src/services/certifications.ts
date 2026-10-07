import { api } from './api';

export interface CertificateUpload {
  file: File;
  type: string;
  organisation: string;
}

/** Shape returned by POST /api/v1/interpreters/certifications/upload/ (CertificationDocumentSerializer). */
export interface CertificationDocument {
  id: number;
  document: string;
  document_name: string;
  uploaded_at: string;
  rejection_reason: string;
}

/**
 * Uploads ONE certificate. The backend accepts a single file per request in the `document`
 * field and needs a signed-in interpreter (Bearer token).
 *
 * `certificate_type` and `issuing_organisation` are sent too, but the backend does not store
 * them yet (CertificationDocument only has `document`). Ask the backend team to add them.
 */
export function uploadCertificate(cert: CertificateUpload) {
  const form = new FormData();
  form.append('document', cert.file);
  form.append('certificate_type', cert.type);
  form.append('issuing_organisation', cert.organisation);
  return api<CertificationDocument>('/api/v1/interpreters/certifications/upload/', {
    method: 'POST',
    body: form,
  });
}
