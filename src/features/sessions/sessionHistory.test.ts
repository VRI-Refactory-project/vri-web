import { describe, expect, it } from 'vitest';
import type { HistoryItem } from '../../services/mySessions';
import { filterSessions, formatWhen, titleFor } from './sessionHistory';

const item = (over: Partial<HistoryItem>): HistoryItem => ({
  id: '1',
  status: 'matched',
  interpreterName: 'Amina Okafor',
  emergency: false,
  createdAt: '2026-10-20T10:00:00',
  ...over,
});

const list = [
  item({ id: '1' }),
  item({ id: '2', status: 'missed', interpreterName: null }),
  item({ id: '3', status: 'cancelled', interpreterName: null }),
];

describe('sessionHistory', () => {
  it('titles a row by the interpreter, or by what happened', () => {
    expect(titleFor(list[0])).toBe('Amina Okafor');
    expect(titleFor(list[1])).toBe('No interpreter');
    expect(titleFor(item({ status: 'waiting', interpreterName: null }))).toBe(
      'Looking for an interpreter',
    );
  });

  it('filters by status and by search', () => {
    expect(filterSessions(list, '', 'missed').map((i) => i.id)).toEqual(['2']);
    expect(filterSessions(list, 'amina', 'all').map((i) => i.id)).toEqual(['1']);
    expect(filterSessions(list, 'cancel', 'all').map((i) => i.id)).toEqual(['3']);
    expect(filterSessions(list, '', 'all')).toHaveLength(3);
  });

  it('writes today, yesterday and older dates differently', () => {
    const now = new Date('2026-10-25T12:00:00');
    expect(formatWhen('2026-10-25T09:05:00', now)).toBe('Today, 9:05 AM');
    expect(formatWhen('2026-10-24T21:30:00', now)).toBe('Yesterday, 9:30 PM');
    expect(formatWhen('2026-09-18T11:05:00', now)).toBe('Sep 18, 11:05 AM');
    expect(formatWhen('not a date', now)).toBe('');
  });
});
