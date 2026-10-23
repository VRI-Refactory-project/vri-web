import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { dashboardPathFor } from '../features/auth/roles';
import { useAuth } from '../hooks/useAuth';

type GuestRouteProps = {
  allowSessionCreatedDuringRoute?: boolean;
};

export function GuestRoute({ allowSessionCreatedDuringRoute = false }: GuestRouteProps) {
  const { session } = useAuth();

  // Registration can create a session before navigating to its next step.
  const [arrivedSignedIn] = useState(() => session !== null);

  const shouldRedirect = session !== null && (!allowSessionCreatedDuringRoute || arrivedSignedIn);

  if (shouldRedirect && session) {
    return <Navigate to={dashboardPathFor(session.user.role)} replace />;
  }

  return <Outlet />;
}
