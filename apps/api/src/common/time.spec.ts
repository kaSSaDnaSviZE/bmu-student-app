import { Weekday } from '@prisma/client';
import { bakuParts, bakuWallToUtc, dateOnlyMatches, shiftWeekday } from './time';

describe('Baku time', () => {
  it('converts a known UTC instant to Baku wall time', () => {
    const parts = bakuParts(new Date('2026-10-02T18:42:00.000Z'));
    expect(parts.hour).toBe(22);
    expect(parts.minute).toBe(42);
    expect(parts.day).toBe(2);
    expect(parts.weekday).toBe(Weekday.FRIDAY);
  });

  it('maps Baku wall time back to UTC', () => {
    const utc = bakuWallToUtc(2026, 10, 2, 10, 0);
    expect(utc.toISOString()).toBe('2026-10-02T06:00:00.000Z');
  });

  it('matches date-only values to the Baku calendar', () => {
    const stored = new Date('2026-10-02T00:00:00.000Z');
    expect(dateOnlyMatches(stored, bakuParts(new Date('2026-10-02T18:42:00.000Z')))).toBe(true);
  });

  it('shifts weekdays', () => {
    expect(shiftWeekday(Weekday.FRIDAY, 1)).toBe(Weekday.SATURDAY);
    expect(shiftWeekday(Weekday.MONDAY, -1)).toBe(Weekday.SUNDAY);
  });
});
