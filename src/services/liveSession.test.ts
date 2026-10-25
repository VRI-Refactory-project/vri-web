import { describe, expect, it } from 'vitest';
import { buildParticipants, formatDuration } from './liveSession';

describe('buildParticipants', () => {
  it('puts the viewer first and names the interpreter for a Deaf user', () => {
    const list = buildParticipants({ viewerRole: 'deaf', interpreterName: 'Amina' });
    expect(list.map((p) => p.role)).toEqual(['deaf', 'interpreter', 'hearing']);
    expect(list[0].self).toBe(true);
    expect(list[1].name).toBe('Amina');
  });

  it('shows the Deaf and hearing participants to an interpreter', () => {
    const list = buildParticipants({ viewerRole: 'interpreter', viewerName: 'Amina' });
    expect(list.map((p) => p.role)).toEqual(['interpreter', 'deaf', 'hearing']);
    expect(list.filter((p) => p.self)).toHaveLength(1);
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(-3)).toBe('0:00');
  });
});
