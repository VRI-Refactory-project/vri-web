import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../services/community';
import { formatWhen, initials, mergeMessages } from './chatHelpers';

const msg = (id: number, read = false): ChatMessage => ({
  id,
  body: `m${id}`,
  createdAt: '',
  mine: true,
  read,
});

describe('formatWhen', () => {
  const now = new Date(2026, 10, 14, 15, 0);

  it('shows the clock for today, Yesterday, then the date', () => {
    expect(formatWhen(new Date(2026, 10, 14, 9, 5).toISOString(), now)).toBe('9:05 AM');
    expect(formatWhen(new Date(2026, 10, 13, 23, 0).toISOString(), now)).toBe('Yesterday');
    expect(formatWhen(new Date(2026, 9, 28, 10, 0).toISOString(), now)).toBe('Oct 28');
  });

  it('shows nothing for a date it cannot read', () => {
    expect(formatWhen('nonsense', now)).toBe('');
  });
});

describe('mergeMessages', () => {
  it('adds new messages, keeps order, and takes the newer copy of a repeat', () => {
    const merged = mergeMessages([msg(3), msg(4)], [msg(4, true), msg(5)]);

    expect(merged.map((m) => m.id)).toEqual([3, 4, 5]);
    expect(merged[1].read).toBe(true);
  });

  it('keeps older messages that a newer page no longer includes', () => {
    expect(mergeMessages([msg(1), msg(2)], [msg(3)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });
});

describe('initials', () => {
  it('takes the first letters of up to two names', () => {
    expect(initials('sarah nsubuga kato')).toBe('SN');
    expect(initials('')).toBe('');
  });
});
