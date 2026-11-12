import { describe, expect, it } from 'vitest';
import { markerClass, timeAgo } from './recentActivity';

const now = new Date('2026-11-09T10:00:00Z');
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

describe('timeAgo', () => {
  it('says "Just now" for less than a minute', () => {
    expect(timeAgo(ago(0), now)).toBe('Just now');
  });

  it('counts minutes, with the right plural', () => {
    expect(timeAgo(ago(1), now)).toBe('1 minute ago');
    expect(timeAgo(ago(59), now)).toBe('59 minutes ago');
  });

  it('counts hours, with the right plural', () => {
    expect(timeAgo(ago(60), now)).toBe('1 hour ago');
    expect(timeAgo(ago(23 * 60), now)).toBe('23 hours ago');
  });

  it('says "Yesterday" after a day and counts days up to a week', () => {
    expect(timeAgo(ago(24 * 60), now)).toBe('Yesterday');
    expect(timeAgo(ago(3 * 24 * 60), now)).toBe('3 days ago');
  });

  it('shows the date after a week', () => {
    expect(timeAgo(ago(10 * 24 * 60), now)).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe('markerClass', () => {
  it('picks a colour from the notification category', () => {
    expect(markerClass('incoming_request')).toBe('bg-purple');
    expect(markerClass('offer_reminder')).toBe('bg-blue');
    expect(markerClass('general')).toBe('bg-green');
  });

  it('falls back to green for a category it does not know', () => {
    expect(markerClass('something_new')).toBe('bg-green');
  });
});
