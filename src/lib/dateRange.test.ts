import {
  MAX_RANGE_DAYS,
  datesInRange,
  formatShortDate,
  rangeLengthDays,
  validateDateRange,
} from './dateRange';

const TODAY = '2026-11-01';

describe('datesInRange', () => {
  it('includes both the start and the end date', () => {
    expect(datesInRange('2026-11-24', '2026-11-27')).toEqual([
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
  });

  it('returns one date when the start and end are the same day', () => {
    expect(datesInRange('2026-11-24', '2026-11-24')).toEqual(['2026-11-24']);
  });

  it('crosses month and year boundaries', () => {
    expect(datesInRange('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  it('returns nothing when the end is before the start or a date is missing', () => {
    expect(datesInRange('2026-11-27', '2026-11-24')).toEqual([]);
    expect(datesInRange('', '2026-11-24')).toEqual([]);
    expect(datesInRange('2026-11-24', '')).toEqual([]);
  });
});

describe('rangeLengthDays', () => {
  it('counts both ends', () => {
    expect(rangeLengthDays('2026-11-24', '2026-11-24')).toBe(1);
    expect(rangeLengthDays('2026-11-24', '2026-11-27')).toBe(4);
  });
});

describe('validateDateRange', () => {
  it('accepts a single day and a valid range', () => {
    expect(validateDateRange('2026-11-24', '2026-11-24', TODAY)).toBeNull();
    expect(validateDateRange('2026-11-24', '2026-11-27', TODAY)).toBeNull();
  });

  it('requires both dates', () => {
    expect(validateDateRange('', '2026-11-27', TODAY)).toBe('Select a start date.');
    expect(validateDateRange('2026-11-24', '', TODAY)).toBe('Select an end date.');
  });

  it('rejects an end date before the start date', () => {
    expect(validateDateRange('2026-11-27', '2026-11-24', TODAY)).toBe(
      'The end date cannot be before the start date.',
    );
  });

  it('rejects a start date in the past', () => {
    expect(validateDateRange('2026-10-31', '2026-11-02', TODAY)).toBe(
      'Past dates cannot be changed.',
    );
  });

  it(`allows exactly ${MAX_RANGE_DAYS} days, counting both ends, and rejects one more`, () => {
    // 1 Nov to 29 Jan: 30 (Nov) + 31 (Dec) + 29 (Jan) = 90 days inclusive.
    expect(rangeLengthDays('2026-11-01', '2027-01-29')).toBe(90);
    expect(validateDateRange('2026-11-01', '2027-01-29', TODAY)).toBeNull();

    // 30 Jan makes it 91.
    expect(rangeLengthDays('2026-11-01', '2027-01-30')).toBe(91);
    expect(validateDateRange('2026-11-01', '2027-01-30', TODAY)).toMatch(/at most 90 days/);
  });
});

describe('formatShortDate', () => {
  it('formats a date key as day and short month', () => {
    expect(formatShortDate('2026-11-24')).toBe('24 Nov');
  });
});
