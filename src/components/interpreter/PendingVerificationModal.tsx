import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApiData } from '../../lib/useApiData';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Modal } from '../Modal';

export type VerificationStatus = 'INACTIVE' | 'APPROVED' | 'REJECTED';

/** GET /api/v1/interpreters/me/ (only the field used here). */
const getInterpreterStatus = () =>
  api<{ verification_status: VerificationStatus }>('/api/v1/interpreters/me/');

/**
 * Pop-up telling an interpreter whose profile is not approved yet that requests are unavailable.
 * It waits until the email is verified so the two pop-ups never show together, and stays out of
 * the way if the status cannot be loaded.
 */
export function PendingVerificationModal() {
  const { session } = useAuth();
  const { data } = useApiData(getInterpreterStatus);
  const [dismissed, setDismissed] = useState(false);

  const emailPending = session?.user.emailVerified === false && !!session.user.email;
  if (!data || data.verification_status === 'APPROVED' || dismissed || emailPending) return null;

  const rejected = data.verification_status === 'REJECTED';
  return (
    <Modal title="Account verification" onClose={() => setDismissed(true)}>
      <div className="modal__icon">
        <ShieldCheck size={28} aria-hidden="true" />
      </div>
      <h2 className="modal__title">
        {rejected ? 'Verification not approved' : 'Your account is under review'}
      </h2>
      <p className="modal__text">
        {rejected
          ? 'Our team could not approve your certificates. Contact support or upload new documents to try again.'
          : 'Our team is checking your certificates. You can look around, but you cannot go online or accept requests until you are approved. We will contact you once a decision is made.'}
      </p>
      <button className="modal__primary" type="button" onClick={() => setDismissed(true)}>
        Got it
      </button>
    </Modal>
  );
}
