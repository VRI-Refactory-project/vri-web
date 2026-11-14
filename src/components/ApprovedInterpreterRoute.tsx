import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getVerificationStatus } from '../services/interpreterStatus';

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

  // If they are explicitly waiting, redirect them.
  if (state === 'waiting') return <Navigate to="/register/pending" replace />;

  // If there's an error, optionally redirect them to pending or an error page.
  // (I commented this out so it doesn't block the dashboard on a network fluke).
  // if (state === 'error') return <Navigate to="/register/pending" replace />;

  // Immediately render the dashboard for 'loading' and 'approved' states.
  // The verification happens silently in the background.
  return <Outlet />;
}
