import { dashboardPathFor, toRole } from './roles';

describe('roles', () => {
  it('maps the API role deaf_hoh to the web role deaf', () => {
    expect(toRole('deaf_hoh')).toBe('deaf');
  });

  it('passes through the other roles', () => {
    expect(toRole('interpreter')).toBe('interpreter');
    expect(toRole('institution')).toBe('institution');
    expect(toRole('admin')).toBe('admin');
  });

  it('throws on an unknown role', () => {
    expect(() => toRole('superuser')).toThrow();
  });

  it('gives each role its dashboard path', () => {
    expect(dashboardPathFor('deaf')).toBe('/dashboard/deaf');
    expect(dashboardPathFor('interpreter')).toBe('/dashboard/interpreter');
    expect(dashboardPathFor('institution')).toBe('/dashboard/institution');
    expect(dashboardPathFor('admin')).toBe('/dashboard/admin');
  });
});
