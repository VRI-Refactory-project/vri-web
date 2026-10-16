import { FLOWS, ROLE_STEP } from './flows';

describe('sign-up flows', () => {
  it('has three steps on every path, so the counter never changes length', () => {
    expect(FLOWS.deaf).toHaveLength(3);
    expect(FLOWS.interpreter).toHaveLength(3);
    expect(FLOWS.institution).toHaveLength(3);
    expect(ROLE_STEP).toHaveLength(3);
  });

  it('starts every path with choosing a role', () => {
    for (const steps of [...Object.values(FLOWS), ROLE_STEP]) {
      expect(steps[0]).toBe('Choose your role');
    }
  });

  it('has an interpreter create the account before uploading certificates', () => {
    expect(FLOWS.interpreter[1]).toBe('Create your account');
    expect(FLOWS.interpreter[2]).toBe('Upload certificates');
  });
});
