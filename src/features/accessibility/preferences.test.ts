import { beforeEach, describe, expect, it } from 'vitest';
import { applyPreferences, DEFAULTS, loadPreferences, savePreferences } from './preferences';

beforeEach(() => localStorage.clear());

describe('accessibility preferences', () => {
  it('uses the defaults when nothing is saved', () => {
    expect(loadPreferences()).toEqual(DEFAULTS);
  });

  it('keeps what was saved, and ignores a text size it does not know', () => {
    savePreferences({ ...DEFAULTS, highContrast: true, textSize: 'large' });
    expect(loadPreferences().highContrast).toBe(true);
    expect(loadPreferences().textSize).toBe('large');
    localStorage.setItem('vri.accessibility', JSON.stringify({ textSize: 'huge' }));
    expect(loadPreferences().textSize).toBe('medium');
  });

  it('survives unreadable saved data', () => {
    localStorage.setItem('vri.accessibility', '{oops');
    expect(loadPreferences()).toEqual(DEFAULTS);
  });

  it('sets contrast and text size on the page', () => {
    const root = document.createElement('html');
    applyPreferences({ ...DEFAULTS, highContrast: true, textSize: 'large' }, root);
    expect(root.dataset.contrast).toBe('high');
    expect(root.dataset.textSize).toBe('large');
  });
});
