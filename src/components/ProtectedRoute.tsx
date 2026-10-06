import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

/** Role-based route guard (V2-066 / NEW-02). */
export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!allow.includes(session.user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
