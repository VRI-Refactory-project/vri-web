import { describe, expect, it } from 'vitest';
import { staysSignedIn } from './leaveDashboard';

describe('staysSignedIn', () => {
  it('keeps people signed in inside the dashboards', () => {
    expect(staysSignedIn('/dashboard/deaf')).toBe(true);
    expect(staysSignedIn('/dashboard/interpreter/availability')).toBe(true);
  });

  it('keeps people signed in on the steps that follow sign-up', () => {
    expect(staysSignedIn('/verify-email')).toBe(true);
    expect(staysSignedIn('/register/interpreter/certifications')).toBe(true);
  });

  it('does not for the public pages', () => {
    for (const path of ['/', '/landing', '/get-started', '/sign-in', '/forgot-password']) {
      expect(staysSignedIn(path)).toBe(false);
    }
  });
});
