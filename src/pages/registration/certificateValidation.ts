export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Keep in step with CERTIFICATE_TYPES in vri-api (apps/interpreters/serializers.py).
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

const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

export function validateFile(file: File): string | undefined {
  // Both checks: the browser-reported type can be empty or wrong, and the extension is what the
  // server checks.
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_TYPES.includes(file.type) || !ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'Upload a PDF, JPG or PNG file.';
  }
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
