import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, sameSettings } from './settings';

describe('sameSettings', () => {
  it('is true for equal settings, even as different objects', () => {
    expect(sameSettings(DEFAULT_SETTINGS, structuredClone(DEFAULT_SETTINGS))).toBe(true);
  });

  it('notices a change in any group', () => {
    const toggled = {
      ...DEFAULT_SETTINGS,
      privacy: { ...DEFAULT_SETTINGS.privacy, profileVisible: false },
    };
    const chosen = {
      ...DEFAULT_SETTINGS,
      preferences: { ...DEFAULT_SETTINGS.preferences, appearance: 'dark' as const },
    };

    expect(sameSettings(DEFAULT_SETTINGS, toggled)).toBe(false);
    expect(sameSettings(DEFAULT_SETTINGS, chosen)).toBe(false);
  });
});
