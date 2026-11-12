import { toInstitutionRole } from '../features/auth/roles';
import type { InstitutionRole } from '../types';
import { api } from './api';

export interface InstitutionOverview {
  /** The institution's name. */
  name: string;
  /** What the signed-in person is inside it. */
  role: InstitutionRole | null;
  staff: { total: number; active: number; revoked: number };
}

interface ApiOverview {
  institution: { organisation_name: string };
  institutional_role?: string | null;
  staff_summary: { total: number; active: number; revoked: number };
}

/**
 * GET /api/v1/dashboard/institution/: the institution, the caller's role in it and how many staff
 * it has. Open to both the institution's admins and its staff.
 */
export async function getInstitutionOverview(): Promise<InstitutionOverview> {
  const raw = await api<ApiOverview>('/api/v1/dashboard/institution/');
  return {
    name: raw.institution.organisation_name,
    role: toInstitutionRole(raw.institutional_role),
    staff: {
      total: raw.staff_summary.total,
      active: raw.staff_summary.active,
      revoked: raw.staff_summary.revoked,
    },
  };
}
