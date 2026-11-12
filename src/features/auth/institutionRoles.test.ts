import { describe, expect, it } from 'vitest';
import { dashboardPathFor, toInstitutionRole } from './roles';

describe('institution roles', () => {
  it('maps the API values and ignores anything else', () => {
    expect(toInstitutionRole('ADMIN')).toBe('ADMIN');
    expect(toInstitutionRole('STAFF')).toBe('STAFF');
    expect(toInstitutionRole('OWNER')).toBeNull();
    expect(toInstitutionRole(null)).toBeNull();
    expect(toInstitutionRole(undefined)).toBeNull();
  });

  it('lands institution staff on their own dashboard', () => {
    expect(dashboardPathFor('institution', 'STAFF')).toBe('/dashboard/staff');
    expect(dashboardPathFor('institution', 'ADMIN')).toBe('/dashboard/institution');
    expect(dashboardPathFor('institution')).toBe('/dashboard/institution');
    expect(dashboardPathFor('deaf', 'STAFF')).toBe('/dashboard/deaf');
  });
});
