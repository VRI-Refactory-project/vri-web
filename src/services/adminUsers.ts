// src/services/adminUsers.ts
import { api } from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'deaf' | 'interpreter' | 'institution' | 'admin';
  verificationStatus: 'verified' | 'pending' | 'suspended';
  registeredAt: string;
  lastActive: string;
}

export interface AdminUserFilters {
  search?: string;
  type?: string;
  status?: string;
  range?: string;
}

interface ApiUser {
  id?: string | number;
  full_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  role?: string;
  verification_status?: string;
  status?: string;
  created_at?: string;
  registered_at?: string;
  last_active?: string;
  last_login?: string;
}

function normalizeUser(raw: ApiUser): AdminUser {
  const role = String(raw.role ?? '').toLowerCase();
  const status = String(raw.verification_status ?? raw.status ?? 'pending').toLowerCase();
  return {
    id: String(raw.id ?? ''),
    name: raw.full_name ?? raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone_number ?? raw.phone ?? '',
    role: (role === 'deaf_hoh' ? 'deaf' : role) as AdminUser['role'],
    verificationStatus:
      status === 'verified' || status === 'approved'
        ? 'verified'
        : status === 'suspended'
          ? 'suspended'
          : 'pending',
    registeredAt: raw.created_at ?? raw.registered_at ?? '',
    lastActive: raw.last_active ?? raw.last_login ?? '',
  };
}

function unwrap(value: unknown): ApiUser[] {
  if (Array.isArray(value)) return value as ApiUser[];
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { results?: unknown }).results)
  ) {
    return (value as { results: ApiUser[] }).results;
  }
  return [];
}

/** GET /api/v1/admin/users/  (filters optional) */
export async function fetchAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type && filters.type !== 'all-types') params.set('role', filters.type);
  if (filters.status && filters.status !== 'all-statuses') params.set('status', filters.status);
  if (filters.range && filters.range !== 'all-time') params.set('range', filters.range);
  const query = params.toString();
  const path = query ? `/api/v1/admin/users/?${query}` : '/api/v1/admin/users/';
  const raw = await api<unknown>(path);
  return unwrap(raw)
    .map(normalizeUser)
    .filter((u) => u.id);
}
