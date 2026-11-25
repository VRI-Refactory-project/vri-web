// // src/services/adminUsers.ts
// import { api } from './api';

// const PATH = '/api/v1/administration/users/';

// export interface AdminUser {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   role: 'deaf' | 'interpreter' | 'institution' | 'admin';
//   verificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
//   registeredAt: string;
//   lastActive: string;
// }

// export interface AdminUserFilters {
//   search?: string;
//   type?: string;
//   status?: string;
//   range?: string;
// }

// interface ApiUser {
//   id?: string | number;
//   full_name?: string;
//   name?: string;
//   email?: string;
//   phone_number?: string;
//   phone?: string;
//   role?: string;
//   verification_status?: string;
//   status?: string;
//   created_at?: string;
//   registered_at?: string;
//   last_active?: string;
//   last_login?: string;
// }

// function normalizeUser(raw: ApiUser): AdminUser {
//   const role = String(raw.role ?? '').toLowerCase();
//   const status = String(raw.verification_status ?? raw.status ?? 'pending').toLowerCase();
//   return {
//     id: String(raw.id ?? ''),
//     name: raw.full_name ?? raw.name ?? '',
//     email: raw.email ?? '',
//     phone: raw.phone_number ?? raw.phone ?? '',
//     role: (role === 'deaf_hoh' ? 'deaf' : role) as AdminUser['role'],
//     verificationStatus:
//       status === 'verified' || status === 'approved'
//         ? 'verified'
//         : status === 'suspended' || status === 'rejected'
//           ? (status as 'suspended' | 'rejected')
//           : 'pending',
//     registeredAt: raw.created_at ?? raw.registered_at ?? '',
//     lastActive: raw.last_active ?? raw.last_login ?? '',
//   };
// }

// function unwrap(value: unknown): ApiUser[] {
//   if (Array.isArray(value)) return value as ApiUser[];
//   if (
//     value &&
//     typeof value === 'object' &&
//     Array.isArray((value as { results?: unknown }).results)
//   ) {
//     return (value as { results: ApiUser[] }).results;
//   }
//   return [];
// }

// /** GET /api/v1/administration/users/  (filters optional) */
// export async function fetchAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
//   const params = new URLSearchParams();
//   if (filters.search) params.set('search', filters.search);
//   if (filters.type && filters.type !== 'all-types') params.set('role', filters.type);
//   if (filters.status && filters.status !== 'all-statuses') params.set('status', filters.status);
//   if (filters.range && filters.range !== 'all-time') params.set('range', filters.range);
//   const query = params.toString();
//   const path = query ? `${PATH}?${query}` : PATH;
//   const raw = await api<unknown>(path);
//   return unwrap(raw)
//     .map(normalizeUser)
//     .filter((u) => u.id);
// }

// src/services/adminUsers.ts
import { api } from './api';

const PATH = '/api/v1/administration/users/';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'deaf' | 'interpreter' | 'institution' | 'admin';
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
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
        : status === 'suspended' || status === 'rejected'
          ? (status as 'suspended' | 'rejected')
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

/** GET /api/v1/administration/users/  (filters optional) */
export async function fetchAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type && filters.type !== 'all-types') params.set('role', filters.type);
  if (filters.status && filters.status !== 'all-statuses') params.set('status', filters.status);
  if (filters.range && filters.range !== 'all-time') params.set('range', filters.range);
  const query = params.toString();
  const path = query ? `${PATH}?${query}` : PATH;
  const raw = await api<unknown>(path);
  return unwrap(raw)
    .map(normalizeUser)
    .filter((u) => u.id);
}

export async function fetchAdminUsersPage(
  filters: AdminUserFilters,
  page: number,
  pageSize: number,
): Promise<{ results: AdminUser[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type && filters.type !== 'all-types') params.set('role', filters.type);
  if (filters.status && filters.status !== 'all-statuses') params.set('status', filters.status);
  if (filters.range && filters.range !== 'all-time') params.set('range', filters.range);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  const raw = await api<unknown>(`${PATH}?${params.toString()}`);
  const rows = unwrap(raw)
    .map(normalizeUser)
    .filter((user) => user.id);
  const record =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { count?: unknown }) : null;
  const total = typeof record?.count === 'number' ? record.count : rows.length;

  // Support existing APIs that ignore page parameters and return the complete array.
  if (total <= rows.length) {
    return {
      results: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
    };
  }
  return { results: rows, total };
}

export async function fetchAllAdminUsers(
  filters: AdminUserFilters = {},
  pageSize = 100,
): Promise<AdminUser[]> {
  const firstPage = await fetchAdminUsersPage(filters, 1, pageSize);
  const users = [...firstPage.results];
  const pageCount = Math.ceil(firstPage.total / pageSize);
  for (let page = 2; page <= pageCount; page += 1) {
    const next = await fetchAdminUsersPage(filters, page, pageSize);
    if (next.results.length === 0) break;
    users.push(...next.results);
  }
  return users;
}

// ==========================================
// --- ACTION HELPERS ---
// ==========================================

/** POST /api/v1/administration/users/{id}/approve/ */
export async function approveUser(userId: string): Promise<void> {
  await api(`${PATH}${userId}/approve/`, { method: 'POST' });
}

/** POST /api/v1/administration/users/{id}/deactivate/ */
export async function deactivateUser(userId: string): Promise<void> {
  await api(`${PATH}${userId}/deactivate/`, { method: 'POST' });
}

/** DELETE /api/v1/administration/users/{id}/delete/ */
export async function deleteUser(userId: string): Promise<void> {
  await api(`${PATH}${userId}/delete/`, { method: 'DELETE' });
}

export async function updateUser(
  userId: string,
  updates: { name: string; email: string; phone: string },
): Promise<void> {
  await api(`${PATH}${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: updates.name,
      email: updates.email,
      phone_number: updates.phone,
    }),
  });
}
