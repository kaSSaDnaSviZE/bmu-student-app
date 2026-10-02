import { ClassStatus, Weekday } from '@prisma/client';
import { bakuParts } from '../common/time';
import { ScheduleSource, selectSchedule } from './resolve-schedule';

function source(partial: Partial<ScheduleSource> & Pick<ScheduleSource, 'id' | 'weekday' | 'startTime' | 'endTime'>): ScheduleSource {
  return {
    courseId: 'c1',
    courseCode: 'CS201',
    courseTitle: 'Programming',
    teacherName: 'Leyla Demo',
    status: ClassStatus.SCHEDULED,
    note: null,
    exceptionDate: null,
    exceptionStatus: null,
    exceptionNote: null,
    buildingCode: 'B',
    buildingName: 'Building B',
    room: '304',
    ...partial,
  };
}

describe('schedule resolver', () => {
  const now = new Date('2026-10-02T05:25:00.000Z'); // 09:25 Baku, Friday
  const today = bakuParts(now);

  const week: ScheduleSource[] = [
    source({ id: 'math', weekday: Weekday.FRIDAY, startTime: '09:00', endTime: '10:20', courseTitle: 'Mathematics', courseCode: 'MATH101' }),
    source({
      id: 'prog',
      weekday: Weekday.FRIDAY,
      startTime: '10:00',
      endTime: '11:30',
      courseTitle: 'Programming',
    }),
    source({
      id: 'eng',
      weekday: Weekday.FRIDAY,
      startTime: '14:00',
      endTime: '15:20',
      courseTitle: 'English',
      exceptionDate: new Date('2026-10-02T00:00:00.000Z'),
      exceptionStatus: ClassStatus.CANCELLED,
      exceptionNote: 'Instructor unavailable',
    }),
    source({
      id: 'phy',
      weekday: Weekday.WEDNESDAY,
      startTime: '12:00',
      endTime: '13:20',
      courseTitle: 'Physics',
      exceptionDate: new Date('2026-09-30T00:00:00.000Z'),
      exceptionStatus: ClassStatus.ROOM_CHANGED,
      overrideRoom: '210',
      overrideBuildingCode: 'C',
      overrideBuildingName: 'Building C',
      exceptionNote: 'Lab moved',
    }),
  ];

  it('shows today in order and marks a cancellation', () => {
    const items = selectSchedule(week, 'today', today, now);
    expect(items.map((item) => item.courseTitle)).toEqual(['Mathematics', 'Programming', 'English']);
    expect(items[2].status).toBe(ClassStatus.CANCELLED);
    expect(items[1].room).toBe('304');
    expect(items[1].startsInMinutes).toBe(35);
  });

  it('picks the next class that is not cancelled', () => {
    const [next] = selectSchedule(week, 'next', today, now);
    expect(next.courseTitle).toBe('Programming');
    expect(next.buildingCode).toBe('B');
    expect(next.room).toBe('304');
    expect(next.startsInMinutes).toBe(35);
  });

  it('applies a room change only on the exception date', () => {
    const wednesday = bakuParts(new Date('2026-09-30T08:00:00.000Z'));
    const items = selectSchedule(week, 'today', wednesday, new Date('2026-09-30T06:00:00.000Z'));
    expect(items[0].status).toBe(ClassStatus.ROOM_CHANGED);
    expect(items[0].room).toBe('210');
    expect(items[0].buildingCode).toBe('C');
  });

  it('returns the coming seven days for week scope', () => {
    const items = selectSchedule(week, 'week', today, now);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items.some((item) => item.courseTitle === 'Physics')).toBe(true);
  });
});
