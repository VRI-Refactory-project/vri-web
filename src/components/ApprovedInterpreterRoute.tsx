import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getVerificationStatus } from '../services/interpreterStatus';

/**
 * Keeps an interpreter out of the dashboard until an admin has approved their certificates.
 * Everyone else waits on the review page, which also tells them if they were not approved.
 * Put it inside ProtectedRoute, which has already checked the role and the email.
 */
export function ApprovedInterpreterRoute() {
  const [state, setState] = useState<'loading' | 'approved' | 'waiting' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getVerificationStatus().then(
      (status) => {
        if (!cancelled) setState(status === 'APPROVED' ? 'approved' : 'waiting');
      },
      () => {
        if (!cancelled) setState('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <p role="status">Checking your account...</p>;
  if (state === 'error') {
    return <p role="alert">We could not check your account. Refresh the page to try again.</p>;
  }
  if (state === 'waiting') return <Navigate to="/register/pending" replace />;
  return <Outlet />;
}
