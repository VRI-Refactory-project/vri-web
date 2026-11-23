import type { AuthUser, InstitutionRole, InstitutionStatus, Role } from '../../types';

// The backend names the Deaf / Hard of Hearing role `deaf_hoh`; the web app calls it `deaf`.
const FROM_API: Record<string, Role> = {
  deaf_hoh: 'deaf',
  interpreter: 'interpreter',
  institution: 'institution',
  admin: 'admin',
};

/** Converts a role value from the API into the web app's Role. */
export function toRole(apiRole: string): Role {
  const role = FROM_API[apiRole];
  if (!role) throw new Error(`Unknown role from the server: ${apiRole}`);
  return role;
}

const DASHBOARDS: Record<Role, string> = {
  deaf: '/dashboard/deaf',
  interpreter: '/dashboard/interpreter',
  institution: '/dashboard/institution',
  admin: '/dashboard/admin',
};

/** Converts the API's `institution_role` (ADMIN or STAFF) into the web app's value. */
export function toInstitutionRole(apiRole: string | null | undefined): InstitutionRole | null {
  return apiRole === 'ADMIN' || apiRole === 'STAFF' ? apiRole : null;
}

const INSTITUTION_STATUSES: readonly InstitutionStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DELETED',
];

export function toInstitutionStatus(
  apiStatus: string | null | undefined,
): InstitutionStatus | null {
  return INSTITUTION_STATUSES.find((status) => status === apiStatus) ?? null;
}

/**
 * True for the person registering a new institution, who still has to upload its licence: its
 * administrator, before the institution is approved. Staff never do (their administrator made their
 * account), and neither does the administrator of an approved institution.
 */
export const needsLicenceUpload = (user: AuthUser) =>
  user.role === 'institution' &&
  user.institutionRole !== 'STAFF' &&
  user.institutionStatus !== 'APPROVED';

/** Where a staff member of an institution lands. */
export const STAFF_DASHBOARD = '/dashboard/staff';

/** Where a signed-in user lands. Institution staff have their own area, apart from the admin's. */
export const dashboardPathFor = (role: Role, institutionRole?: InstitutionRole | null) =>
  role === 'institution' && institutionRole === 'STAFF' ? STAFF_DASHBOARD : DASHBOARDS[role];
