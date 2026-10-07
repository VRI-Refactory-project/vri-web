import type { Role } from '../../types';

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

/** Where a signed-in user of this role lands. */
export const dashboardPathFor = (role: Role) => DASHBOARDS[role];
