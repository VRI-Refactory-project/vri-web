import { describe, expect, it } from 'vitest';
import {
  countLabel,
  dateTile,
  dayLabel,
  formatDuration,
  nextSession,
  orderSessions,
  startsLabel,
  type InterpreterSession,
} from './interpreterSessions';

const NOW = new Date(2026, 9, 30, 14, 20); // Oct 30, 2026, 2:20 PM local

const session = (id: string, start: Date, status: InterpreterSession['status']) => ({
  id,
  withName: `Person ${id}`,
  type: 'Interpreted call',
  start: start.toISOString(),
  durationMinutes: 45,
  status,
});

const SESSIONS: InterpreterSession[] = [
  session('old', new Date(2026, 8, 10, 9, 0), 'completed'),
  session('later', new Date(2026, 10, 2, 9, 0), 'upcoming'),
  session('recent', new Date(2026, 9, 13, 9, 0), 'completed'),
  session('soon', new Date(2026, 9, 30, 14, 30), 'upcoming'),
];

describe('interpreter sessions helpers', () => {
  it('picks the soonest upcoming session', () => {
    expect(nextSession(SESSIONS)?.id).toBe('soon');
    expect(nextSession(SESSIONS.filter((s) => s.status === 'completed'))).toBeNull();
  });

  it('lists upcoming soonest first, then past latest first', () => {
    expect(orderSessions(SESSIONS).map((s) => s.id)).toEqual(['soon', 'later', 'recent', 'old']);
  });

  it('names the day', () => {
    expect(dayLabel(new Date(2026, 9, 30, 18).toISOString(), NOW)).toBe('Today');
    expect(dayLabel(new Date(2026, 9, 31, 9).toISOString(), NOW)).toBe('Tomorrow');
    expect(dayLabel(new Date(2026, 9, 13, 9).toISOString(), NOW)).toBe('Oct 13');
  });

  it('says when the next session starts', () => {
    expect(startsLabel(new Date(2026, 9, 30, 14, 30).toISOString(), NOW)).toBe('starts in 10 mins');
    expect(startsLabel(new Date(2026, 9, 30, 14, 21).toISOString(), NOW)).toBe('starts in 1 min');
    expect(startsLabel(new Date(2026, 9, 30, 16, 0).toISOString(), NOW)).toBe(
      'starts today at 4:00 PM',
    );
    expect(startsLabel(new Date(2026, 10, 2, 9).toISOString(), NOW)).toBe('starts Nov 2');
    expect(startsLabel(new Date(2026, 9, 30, 14, 0).toISOString(), NOW)).toBe('starting now');
  });

  it('builds the date box', () => {
    expect(dateTile(new Date(2026, 9, 30, 9).toISOString(), NOW)).toEqual({
      top: 'TODAY',
      day: '30',
    });
    expect(dateTile(new Date(2026, 8, 10, 9).toISOString(), NOW)).toEqual({
      top: 'SEP',
      day: '10',
    });
  });

  it('writes durations', () => {
    expect(formatDuration(45)).toBe('45 mins');
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(90)).toBe('1 hr 30 mins');
    expect(formatDuration(121)).toBe('2 hrs 1 min');
  });

  it('counts upcoming and completed, leaving out zeros', () => {
    expect(countLabel(SESSIONS)).toBe('2 upcoming · 2 completed');
    expect(countLabel(SESSIONS.filter((s) => s.status === 'completed'))).toBe('2 completed');
    expect(countLabel([])).toBe('No sessions');
  });
});
