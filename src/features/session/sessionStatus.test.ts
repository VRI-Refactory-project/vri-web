import { describe, expect, it } from 'vitest';
import { labelFor, STATUS_LABELS } from './sessionStatus';

describe('session status labels', () => {
  it('has a label for every state', () => {
    for (const state of Object.keys(STATUS_LABELS)) {
      const label = labelFor(state);
      expect(label.title.length).toBeGreaterThan(0);
      expect(label.detail.length).toBeGreaterThan(0);
    }
  });

  it('gives completed, cancelled and failed different wording', () => {
    const titles = ['COMPLETED', 'CANCELLED', 'FAILED'].map((s) => labelFor(s).title);
    expect(new Set(titles).size).toBe(3);
  });

  it('groups states into the four stages a person sees', () => {
    expect(labelFor('QUEUED').stage).toBe('waiting');
    expect(labelFor('CONNECTING').stage).toBe('connecting');
    expect(labelFor('ACTIVE').stage).toBe('connected');
    expect(labelFor('COMPLETED').stage).toBe('ended');
    expect(labelFor('FAILED').stage).toBe('problem');
  });

  it('treats an unknown state as waiting', () => {
    expect(labelFor('SOMETHING_NEW')).toEqual(STATUS_LABELS.QUEUED);
  });
});
