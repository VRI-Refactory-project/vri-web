// src/services/admin.ts
import { api } from './api';

export interface AdminDashboardSummary {
  totalUsers: number;
  dhhUsers: number;
  institutions: number;
  interpreters: number;
  pendingVerifications: number;
}

/** GET /api/v1/dashboard/admin/ */
interface ApiAdminDashboard {
  interpreters_pending_verification: number;
  institutions_pending_approval: number;
  users_by_role: Record<string, number>;
}

export async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const raw = await api<ApiAdminDashboard>('/api/v1/dashboard/admin/');
  const byRole = raw.users_by_role;
  return {
    totalUsers: Object.values(byRole).reduce((sum, n) => sum + n, 0),
    dhhUsers: byRole.deaf_hoh ?? 0,
    institutions: byRole.institution ?? 0,
    interpreters: byRole.interpreter ?? 0,
    pendingVerifications: raw.interpreters_pending_verification,
  };
}
