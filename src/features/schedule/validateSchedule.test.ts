import { describe, expect, it } from 'vitest';
import { validateSchedule } from './validateSchedule';

describe('validateSchedule', () => {
  const now = new Date('2026-11-10T10:00:00');

  const ok = {
    date: '2026-11-13',
    time: '10:30',
    duration: '30',
    sessionType: 'medical',
  };

  it('accepts a complete future booking', () => {
    expect(validateSchedule(ok, now)).toEqual({});
  });

  it('asks for every missing field', () => {
    const errors = validateSchedule({ date: '', time: '', duration: '', sessionType: '' }, now);
    expect(Object.keys(errors).sort()).toEqual(['date', 'duration', 'sessionType', 'time']);
  });

  it('refuses a time that has already passed', () => {
    const past = { ...ok, date: '2026-11-09', time: '09:00' };
    expect(validateSchedule(past, now).date).toBe('Choose a date and time in the future.');
  });
});
