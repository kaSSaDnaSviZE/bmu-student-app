import { ClassStatus, Weekday } from '@prisma/client';
import {
  BakuParts,
  bakuWallToUtc,
  dateOnlyMatches,
  minutesUntil,
  parseHm,
  shiftWeekday,
} from '../common/time';

export interface ScheduleSource {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  status: ClassStatus;
  note: string | null;
  exceptionDate: Date | null;
  exceptionStatus: ClassStatus | null;
  exceptionNote: string | null;
  buildingCode: string;
  buildingName: string;
  room: string;
  overrideBuildingCode?: string | null;
  overrideBuildingName?: string | null;
  overrideRoom?: string | null;
  overrideStartTime?: string | null;
  overrideEndTime?: string | null;
  overrideTeacherName?: string | null;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  weekday: Weekday;
  date: string;
  startTime: string;
  endTime: string;
  buildingCode: string;
  buildingName: string;
  room: string;
  status: ClassStatus;
  note: string | null;
  startsInMinutes: number | null;
}

export type ScheduleScope = 'today' | 'tomorrow' | 'week' | 'next';

export function resolveForDate(source: ScheduleSource, day: BakuParts, now: Date): ScheduleItem {
  const exceptionApplies =
    source.exceptionDate != null && dateOnlyMatches(source.exceptionDate, day);
  const status =
    exceptionApplies && source.exceptionStatus ? source.exceptionStatus : source.status;
  const useOverride = exceptionApplies || status !== ClassStatus.SCHEDULED;
  const startTime =
    useOverride && source.overrideStartTime ? source.overrideStartTime : source.startTime;
  const endTime = useOverride && source.overrideEndTime ? source.overrideEndTime : source.endTime;
  const roomChanged = status === ClassStatus.ROOM_CHANGED && source.overrideRoom;
  const teacherChanged = status === ClassStatus.TEACHER_CHANGED && source.overrideTeacherName;
  const start = parseHm(startTime);
  const startAt = bakuWallToUtc(day.year, day.month, day.day, start.hour, start.minute);
  return {
    id: source.id,
    courseId: source.courseId,
    courseCode: source.courseCode,
    courseTitle: source.courseTitle,
    teacherName: teacherChanged ? (source.overrideTeacherName as string) : source.teacherName,
    weekday: source.weekday,
    date: isoDate(day),
    startTime,
    endTime,
    buildingCode: roomChanged
      ? (source.overrideBuildingCode ?? source.buildingCode)
      : source.buildingCode,
    buildingName: roomChanged
      ? (source.overrideBuildingName ?? source.buildingName)
      : source.buildingName,
    room: roomChanged ? (source.overrideRoom as string) : source.room,
    status,
    note: exceptionApplies ? (source.exceptionNote ?? source.note) : source.note,
    startsInMinutes: minutesUntil(now, startAt),
  };
}

export function selectSchedule(
  sources: ScheduleSource[],
  scope: ScheduleScope,
  today: BakuParts,
  now: Date,
): ScheduleItem[] {
  if (scope === 'next') {
    const upcoming = lookAhead(sources, today, now, 8).filter(
      (item) => item.status !== ClassStatus.CANCELLED && (item.startsInMinutes ?? -1) >= 0,
    );
    upcoming.sort((a, b) => (a.startsInMinutes ?? 0) - (b.startsInMinutes ?? 0));
    return upcoming.slice(0, 1);
  }
  if (scope === 'today') {
    return dayItems(sources, today, now);
  }
  if (scope === 'tomorrow') {
    const tomorrow = addCalendarDays(today, 1);
    return dayItems(sources, tomorrow, now);
  }
  const items: ScheduleItem[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    items.push(...dayItems(sources, addCalendarDays(today, offset), now));
  }
  return items;
}

function dayItems(sources: ScheduleSource[], day: BakuParts, now: Date): ScheduleItem[] {
  return sources
    .filter((source) => source.weekday === day.weekday)
    .map((source) => resolveForDate(source, day, now))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function lookAhead(sources: ScheduleSource[], today: BakuParts, now: Date, days: number) {
  const items: ScheduleItem[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    items.push(...dayItems(sources, addCalendarDays(today, offset), now));
  }
  return items;
}

function addCalendarDays(parts: BakuParts, days: number): BakuParts {
  const noon = bakuWallToUtc(parts.year, parts.month, parts.day, 12, 0);
  noon.setUTCDate(noon.getUTCDate() + days);
  const next = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(noon);
  const bag: Record<string, string> = {};
  for (const part of next) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
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
    hour: 12,
    minute: 0,
    weekday: map[bag.weekday] ?? shiftWeekday(parts.weekday, days),
  };
}

function isoDate(day: BakuParts): string {
  const month = String(day.month).padStart(2, '0');
  const date = String(day.day).padStart(2, '0');
  return `${day.year}-${month}-${date}`;
}
