export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// TODO: confirm the final list of certificate types with the product owner / design.
export const CERTIFICATE_TYPES = [
  'Uganda Sign Language interpreter certificate',
  'Diploma in sign language interpretation',
  'Degree in sign language interpretation',
  'Other',
];

export interface CertificateEntry {
  id: number;
  file: File | null;
  type: string;
  organisation: string;
}

export interface EntryErrors {
  file?: string;
  type?: string;
  organisation?: string;
}

export function validateFile(file: File): string | undefined {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Upload a PDF, JPG or PNG file.';
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 10 MB.';
  return undefined;
}

/** V2-003 edge case: submission is blocked until the minimum required fields are present. */
export function validateEntry(entry: CertificateEntry): EntryErrors {
  const errors: EntryErrors = {};
  if (!entry.file) errors.file = 'Upload your certificate.';
  else errors.file = validateFile(entry.file);
  if (!entry.type) errors.type = 'Select a certificate type.';
  if (!entry.organisation.trim()) errors.organisation = 'Enter the issuing organisation.';
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as EntryErrors;
}
