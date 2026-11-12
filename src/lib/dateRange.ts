/**
 * Helpers for picking a range of calendar days on the availability page.
 * Dates are YYYY-MM-DD keys in the browser's local time, matching how the page builds them.
 */

/** The longest range one request may cover. Both the first and last day count. */
export const MAX_RANGE_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, '0');

// Noon avoids daylight-saving changes moving the date to the day before or after.
const fromKey = (key: string) => new Date(`${key}T12:00:00`);

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** How many calendar days the range covers, counting both the start and the end. */
export function rangeLengthDays(start: string, end: string): number {
  return Math.round((fromKey(end).getTime() - fromKey(start).getTime()) / MS_PER_DAY) + 1;
}

/** Every date from start to end, both included. Empty when the range is not valid. */
export function datesInRange(start: string, end: string): string[] {
  if (!start || !end || end < start) return [];

  const dates: string[] = [];
  const cursor = fromKey(start);
  const last = fromKey(end);

  while (cursor <= last) {
    dates.push(keyOf(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** Returns a message for the first problem with the range, or null when it is valid. */
export function validateDateRange(start: string, end: string, today: string): string | null {
  if (!start) return 'Select a start date.';
  if (!end) return 'Select an end date.';
  if (end < start) return 'The end date cannot be before the start date.';
  if (start < today) return 'Past dates cannot be changed.';
  if (rangeLengthDays(start, end) > MAX_RANGE_DAYS) {
    return `A range can cover at most ${MAX_RANGE_DAYS} days. Choose a shorter range.`;
  }
  return null;
}

/** "24 Nov" for messages and labels. */
export function formatShortDate(key: string): string {
  return fromKey(key).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
