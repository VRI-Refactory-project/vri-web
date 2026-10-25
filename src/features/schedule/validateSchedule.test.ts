import { describe, expect, it } from 'vitest';
import { validateSchedule } from './validateSchedule';

const now = new Date('2026-10-25T12:00:00');
const ok = {
  date: '2026-10-26',
  time: '10:30',
  location: 'Northside Medical Center',
  specialisation: 'Medical',
};

describe('validateSchedule', () => {
  it('accepts a complete future booking', () => {
    expect(validateSchedule(ok, now)).toEqual({});
  });

  it('asks for every missing field', () => {
    const errors = validateSchedule({ date: '', time: '', location: ' ', specialisation: '' }, now);
    expect(Object.keys(errors).sort()).toEqual(['date', 'location', 'specialisation', 'time']);
  });

  it('refuses a time that has already passed', () => {
    expect(validateSchedule({ ...ok, date: '2026-10-25', time: '09:00' }, now).date).toMatch(
      /future/,
    );
  });
});
