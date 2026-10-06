import { api } from './api';

export interface CertificateUpload {
  file: File;
  type: string;
  organisation: string;
}

// Placeholder endpoint until the V2-003 backend contract is agreed (Zipporah / Shadia).
export function uploadCertifications(certificates: CertificateUpload[]) {
  const form = new FormData();
  certificates.forEach((c, i) => {
    form.append(`certificates[${i}][file]`, c.file);
    form.append(`certificates[${i}][type]`, c.type);
    form.append(`certificates[${i}][organisation]`, c.organisation);
  });
  return api<void>('/api/interpreters/certifications/', { method: 'POST', body: form });
}
