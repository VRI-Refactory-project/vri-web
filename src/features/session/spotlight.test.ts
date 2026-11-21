import { describe, expect, it } from 'vitest';
import { pickSpotlight, type SpotlightTile } from './spotlight';

const me = (role?: SpotlightTile['role']): SpotlightTile => ({ id: 'self', self: true, role });
const deaf: SpotlightTile = { id: 'u2', role: 'deaf' };
const staff: SpotlightTile = { id: 'u5', role: 'institution' };
const interpreter: SpotlightTile = { id: 'u9', role: 'interpreter' };
const guest: SpotlightTile = { id: 'guest-3', role: 'guest' };
const sharedScreen: SpotlightTile = { id: 'guest-3#screen', screen: true };

describe('pickSpotlight', () => {
  it('gives the Deaf user, staff and hearing guests the interpreter', () => {
    for (const viewer of ['deaf', 'institution', 'guest'] as const) {
      expect(pickSpotlight([me(viewer), guest, interpreter], null, viewer)).toBe('u9');
    }
  });

  it('gives the interpreter the Deaf user, or the staff member when there is no Deaf user', () => {
    expect(pickSpotlight([me('interpreter'), guest, deaf], null, 'interpreter')).toBe('u2');
    expect(pickSpotlight([me('interpreter'), guest, staff], null, 'interpreter')).toBe('u5');
  });

  it('puts a shared screen before any person', () => {
    expect(pickSpotlight([me('deaf'), interpreter, guest, sharedScreen], null, 'deaf')).toBe(
      'guest-3#screen',
    );
  });

  it('keeps the tile the viewer pinned, even over a shared screen', () => {
    expect(pickSpotlight([me('deaf'), interpreter, guest, sharedScreen], 'guest-3', 'deaf')).toBe(
      'guest-3',
    );
  });

  it('ignores a pin on someone who has left', () => {
    expect(pickSpotlight([me('deaf'), interpreter], 'guest-3', 'deaf')).toBe('u9');
  });

  it('falls back to anyone else, then to the viewer alone', () => {
    expect(pickSpotlight([me('deaf'), guest], null, 'deaf')).toBe('guest-3');
    expect(pickSpotlight([me('deaf')], null, 'deaf')).toBe('self');
    // A role the screen does not know yet still gets the other person.
    expect(pickSpotlight([me(), { id: 'u7' }], null, undefined)).toBe('u7');
  });
});
