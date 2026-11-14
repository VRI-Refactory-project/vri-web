import { Navigate, Outlet } from 'react-router-dom';
import { dashboardPathFor } from '../features/auth/roles';
import { useAuth } from '../hooks/useAuth';
import type { InstitutionRole } from '../types';

/**
 * Splits the institution area in two. Admins manage the institution; staff book interpreters.
 * Put it inside a ProtectedRoute that allows the `institution` role. Someone on the wrong side is
 * sent to their own dashboard. A missing institution role counts as ADMIN, the account owner.
 */
export function InstitutionRoleRoute({ allow }: { allow: InstitutionRole }) {
  const { session } = useAuth();
  const mine: InstitutionRole = session?.user.institutionRole ?? 'ADMIN';
  if (mine !== allow) {
    return <Navigate to={dashboardPathFor('institution', mine)} replace />;
  }
  return <Outlet />;
}
