import { api } from './api';
import { normalizePhone } from '../lib/validation';

// V2-006 staff accounts. The institution administrator manages their own institution's staff
// (vri-api apps/institutions: /api/v1/institutions/me/staff/). Only ADMINs of an approved institution
// may call these; anyone else gets a 403.

const BASE = '/api/v1/institutions/me/staff/';

/** The departments the forms offer. Saved by the API as the staff member's job title. */
export const DEPARTMENTS = [
  'Healthcare',
  'Reception',
  'Social Services',
  'IT Support',
  'Administration',
];

/** Shape returned by the API (StaffSerializer). */
export interface ApiStaff {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: 'ADMIN' | 'STAFF';
  job_title: string;
  status: 'ACTIVE' | 'REVOKED';
  last_login: string | null;
  created_at: string;
  revoked_at: string | null;
}

/** What the screens show. "Invitation sent" means active but never signed in yet. */
export type StaffStatus = 'Active' | 'Invitation Sent' | 'Inactive';

export interface StaffMember {
  id: string;
  /** The person's user account id; compare with the signed-in user's id to spot "this is me". */
  userId: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  /** Shown as "Department"; stored by the API as the staff member's job title. */
  department: string;
  role: 'Admin' | 'Staff';
  status: StaffStatus;
  /** ISO time of the last sign-in, or null if they have never signed in. */
  lastLogin: string | null;
}

export interface NewStaffMember {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  role: 'Admin' | 'Staff';
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? ''];
  return letters.join('').toUpperCase();
}

export function toStaffMember(raw: ApiStaff): StaffMember {
  let status: StaffStatus = 'Active';
  if (raw.status === 'REVOKED') status = 'Inactive';
  else if (!raw.last_login) status = 'Invitation Sent';
  return {
    id: String(raw.id),
    userId: String(raw.user_id),
    name: raw.full_name,
    initials: initialsOf(raw.full_name),
    email: raw.email ?? '',
    phone: raw.phone_number,
    department: raw.job_title,
    role: raw.role === 'ADMIN' ? 'Admin' : 'Staff',
    status,
    lastLogin: raw.last_login,
  };
}

/** "5 min ago", "3 days ago"; "—" when the person has never signed in. */
export function lastActiveLabel(lastLogin: string | null, now: Date = new Date()): string {
  if (!lastLogin) return '—';
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(lastLogin).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await api<ApiStaff[]>(BASE);
  return rows.map(toStaffMember);
}

/** Creates the account; the API emails the person their login details (a temporary password). */
export async function createStaff(d: NewStaffMember): Promise<StaffMember> {
  const raw = await api<ApiStaff>(BASE, {
    method: 'POST',
    body: JSON.stringify({
      full_name: d.fullName.trim(),
      email: d.email.trim(),
      phone_number: normalizePhone(d.phone),
      job_title: d.department,
      role: d.role === 'Admin' ? 'ADMIN' : 'STAFF',
    }),
  });
  return toStaffMember(raw);
}

export async function getStaff(id: string): Promise<StaffMember> {
  return toStaffMember(await api<ApiStaff>(`${BASE}${id}/`));
}

/** What an institution admin may change. Phone and email are the person's sign-in details, so the
 * API does not let an admin change them. */
export interface StaffChanges {
  fullName?: string;
  department?: string;
  role?: 'Admin' | 'Staff';
}

export async function updateStaff(id: string, changes: StaffChanges): Promise<StaffMember> {
  const body: Record<string, string> = {};
  if (changes.fullName !== undefined) body.full_name = changes.fullName.trim();
  if (changes.department !== undefined) body.job_title = changes.department;
  if (changes.role !== undefined) body.role = changes.role === 'Admin' ? 'ADMIN' : 'STAFF';
  const raw = await api<ApiStaff>(`${BASE}${id}/`, { method: 'PATCH', body: JSON.stringify(body) });
  return toStaffMember(raw);
}

/** Removes access at once: the person is signed out and cannot sign in again until reinstated. */
export async function revokeStaff(id: string): Promise<StaffMember> {
  return toStaffMember(await api<ApiStaff>(`${BASE}${id}/revoke/`, { method: 'POST' }));
}

/** Gives a revoked person access again, with the same password and role as before. */
export async function reinstateStaff(id: string): Promise<StaffMember> {
  return toStaffMember(await api<ApiStaff>(`${BASE}${id}/reinstate/`, { method: 'POST' }));
}
