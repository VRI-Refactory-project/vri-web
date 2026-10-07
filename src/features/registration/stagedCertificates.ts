import type { CertificateEntry } from '../../pages/registration/certificateValidation';

// Interpreters choose their certificates BEFORE the account exists, but the upload endpoint needs
// a signed-in user. So the files wait here, in memory only, until the account has been created.
// A page reload clears them, and the user is sent back to pick them again.
let staged: CertificateEntry[] = [];

export const stageCertificates = (entries: CertificateEntry[]) => {
  staged = [...entries];
};
export const stagedCertificates = () => staged;
export const unstageCertificate = (id: number) => {
  staged = staged.filter((e) => e.id !== id);
};
export const clearStagedCertificates = () => {
  staged = [];
};
