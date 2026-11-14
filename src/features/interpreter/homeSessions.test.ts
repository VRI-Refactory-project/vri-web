import { describe, expect, it } from 'vitest';
import { recentSessions, type HomeSession } from './homeSessions';

const session = (id: number, running = false): HomeSession => ({
  id,
  withName: `Person ${id}`,
  photo: null,
  running,
  startedAt: '2026-11-12T09:00:00.000Z',
  durationMinutes: running ? null : 10,
});

describe('recentSessions', () => {
  it('keeps the order it was given when nothing is running', () => {
    expect(recentSessions([session(3), session(2), session(1)]).map((s) => s.id)).toEqual([
      3, 2, 1,
    ]);
  });

  it('puts a session that is still going first so it can be rejoined', () => {
    expect(recentSessions([session(3), session(2, true), session(1)]).map((s) => s.id)).toEqual([
      2, 3, 1,
    ]);
  });

  it('keeps only the latest 5', () => {
    const many = Array.from({ length: 8 }, (_, index) => session(8 - index));

    expect(recentSessions(many)).toHaveLength(5);
  });
});
