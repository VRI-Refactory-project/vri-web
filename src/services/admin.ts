// src/services/admin.ts
import { api } from './api';

export interface AdminDashboardSummary {
  totalUsers: number;
  dhhUsers: number;
  institutions: number;
  interpreters: number;
  pendingVerifications: number;
}

interface ApiSummary {
  total_users: number;
  dhh_users: number;
  institutions: number;
  interpreters: number;
  pending_verifications: number;
}

export async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const raw = await api<ApiSummary>('/api/v1/admin/dashboard/summary/');
  return {
    totalUsers: raw.total_users,
    dhhUsers: raw.dhh_users,
    institutions: raw.institutions,
    interpreters: raw.interpreters,
    pendingVerifications: raw.pending_verifications,
  };
}
