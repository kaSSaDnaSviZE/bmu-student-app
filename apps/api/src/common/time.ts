import { Weekday } from '@prisma/client';

const WEEKDAYS: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export interface BakuParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: Weekday;
}

/** Asia/Baku is UTC+4 year-round. */
export function bakuParts(now = new Date()): BakuParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baku',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
  const short = bag.weekday;
  const map: Record<string, Weekday> = {
    Sun: Weekday.SUNDAY,
    Mon: Weekday.MONDAY,
    Tue: Weekday.TUESDAY,
    Wed: Weekday.WEDNESDAY,
    Thu: Weekday.THURSDAY,
    Fri: Weekday.FRIDAY,
    Sat: Weekday.SATURDAY,
  };
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    weekday: map[short] ?? Weekday.MONDAY,
  };
}

export function bakuWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 4, minute, 0));
}

export function addDays(parts: BakuParts, days: number): BakuParts {
  const utc = bakuWallToUtc(parts.year, parts.month, parts.day, 12, 0);
  utc.setUTCDate(utc.getUTCDate() + days);
  return bakuParts(utc);
}

export function weekdayOn(parts: BakuParts): Weekday {
  return parts.weekday;
}

export function sameCalendarDay(a: Date, parts: BakuParts): boolean {
  const b = bakuParts(a);
  return a.getUTCHours() === 0
    ? a.getUTCFullYear() === parts.year &&
        a.getUTCMonth() + 1 === parts.month &&
        a.getUTCDate() === parts.day
    : b.year === parts.year && b.month === parts.month && b.day === parts.day;
}

/** Compare a @db.Date value (UTC midnight) with a Baku calendar day. */
export function dateOnlyMatches(dateOnly: Date, parts: BakuParts): boolean {
  return (
    dateOnly.getUTCFullYear() === parts.year &&
    dateOnly.getUTCMonth() + 1 === parts.month &&
    dateOnly.getUTCDate() === parts.day
  );
}

export function dateOnlyUtc(parts: BakuParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function shiftWeekday(weekday: Weekday, by: number): Weekday {
  const index = WEEKDAYS.indexOf(weekday);
  return WEEKDAYS[(index + by + 7 * 8) % 7];
}

export function greetingPeriod(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function parseHm(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map((part) => Number(part));
  return { hour: h || 0, minute: m || 0 };
}

export function minutesUntil(now: Date, start: Date): number {
  return Math.round((start.getTime() - now.getTime()) / 60000);
}
