import { describe, expect, it } from 'vitest';
import type { HistoryItem } from '../../services/mySessions';
import { latestConfirmable, longWhen, sessionType, specialisationLabel } from './sessionDetails';

const item = (over: Partial<HistoryItem>): HistoryItem => ({
  id: '1',
  status: 'matched',
  interpreterName: 'Amina',
  emergency: false,
  createdAt: '2026-10-20T10:00:00',
  ...over,
});

describe('sessionDetails', () => {
  it('names the session type and specialisation', () => {
    expect(sessionType(true)).toBe('Emergency VRI');
    expect(sessionType(false)).toBe('Immediate VRI');
    expect(specialisationLabel('MEDICAL')).toBe('Medical');
    expect(specialisationLabel('???')).toBe('General');
  });

  it('picks the newest request that is still waiting or matched', () => {
    const list = [
      item({ id: '1', createdAt: '2026-10-01T10:00:00' }),
      item({ id: '2', createdAt: '2026-10-03T10:00:00', status: 'waiting' }),
      item({ id: '3', createdAt: '2026-10-05T10:00:00', status: 'cancelled' }),
    ];
    expect(latestConfirmable(list)?.id).toBe('2');
    expect(latestConfirmable([item({ status: 'missed' })])).toBeNull();
  });

  it('writes a scheduled time out in full', () => {
    expect(longWhen('2026-09-24', '10:30')).toBe('Thursday, September 24, at 10:30 AM');
    expect(longWhen('', '')).toBe('');
  });
});
