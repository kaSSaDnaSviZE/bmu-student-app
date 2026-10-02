import { Inject, Injectable } from '@nestjs/common';
import { AcademicEventType } from '@prisma/client';
import { AuthUser } from '../common/auth-user';
import { requireStudent } from '../common/student-access';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';
import { ScheduleItem } from '../schedule/resolve-schedule';
import { ASSISTANT_HELP, detectIntent } from './intent';
import { StudentTools } from './student-tools';

@Injectable()
export class AiService {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  async chat(user: AuthUser, message: string, now = new Date()) {
    const studentId = requireStudent(user);
    const tools = new StudentTools(this.data, studentId, now);
    const intent = detectIntent(message);
    const toolsUsed: string[] = [];

    if (intent.type === 'refused') {
      return {
        answer:
          'I can only use approved tools for your own student record. I cannot run database queries or show anyone else’s data.',
        intent: intent.type,
        toolsUsed,
      };
    }

    if (intent.type === 'schedule') {
      toolsUsed.push('getStudentSchedule');
      const result = await tools.getStudentSchedule(intent.scope);
      return { answer: formatSchedule(intent.scope, result), intent: intent.type, toolsUsed, data: result };
    }
    if (intent.type === 'deadlines') {
      toolsUsed.push('getStudentDeadlines');
      const result = await tools.getStudentDeadlines();
      const lines = result.length
        ? result.map((item) => `${item.courseTitle}: ${item.title} · due ${item.deadline} · ${item.status}`).join('\n')
        : 'You have no deadlines in the next week.';
      return { answer: lines, intent: intent.type, toolsUsed, data: result };
    }
    if (intent.type === 'attendance') {
      toolsUsed.push('getStudentAttendance');
      const result = await tools.getStudentAttendance(intent.courseQuery);
      const lines = result.length
        ? result
            .map((item) => `${item.courseTitle} ${item.percent == null ? 'n/a' : `${item.percent}%`}`)
            .join('\n')
        : 'I could not find attendance for that course.';
      return { answer: lines, intent: intent.type, toolsUsed, data: result };
    }
    if (intent.type === 'grades') {
      toolsUsed.push('getStudentGrades');
      const result = await tools.getStudentGrades();
      const lines = result
        .map((item) => {
          const current = item.summary.currentPercent == null ? 'n/a' : `${item.summary.currentPercent}%`;
          const final = item.summary.finalPercent == null ? 'not final' : `${item.summary.finalPercent}%`;
          return `${item.courseTitle}: current ${current}, final ${final}`;
        })
        .join('\n');
      return { answer: lines || 'No grades yet.', intent: intent.type, toolsUsed, data: result };
    }
    if (intent.type === 'calendar') {
      toolsUsed.push('getAcademicCalendar');
      const result = await tools.getAcademicCalendar();
      const rows = intent.examsOnly ? result.filter((item) => item.type === AcademicEventType.EXAM) : result;
      const lines = rows
        .map((item) => `${item.startsAt.slice(0, 10)} · ${item.type} · ${item.title}`)
        .join('\n');
      return { answer: lines || 'No matching calendar events.', intent: intent.type, toolsUsed, data: rows };
    }
    if (intent.type === 'location') {
      toolsUsed.push('getCampusLocation');
      const result = await tools.getCampusLocation(intent.query);
      const lines = result.length
        ? result.map((item) => `${item.label}. ${item.note}`).join('\n')
        : 'I could not find that place in the campus directory.';
      return { answer: lines, intent: intent.type, toolsUsed, data: result };
    }
    if (intent.type === 'courses') {
      toolsUsed.push('getStudentCourses');
      const result = await tools.getStudentCourses();
      return {
        answer: result.map((item) => `${item.code} ${item.title} · ${item.teacherName}`).join('\n') || 'No courses.',
        intent: intent.type,
        toolsUsed,
        data: result,
      };
    }
    return { answer: ASSISTANT_HELP, intent: 'help', toolsUsed };
  }
}

function formatSchedule(scope: string, result: ScheduleItem | ScheduleItem[] | null): string {
  if (!result || (Array.isArray(result) && result.length === 0)) {
    return scope === 'next' ? 'You have no upcoming class in the next week.' : 'You have no classes in that range.';
  }
  const items = Array.isArray(result) ? result : [result];
  return items
    .map((item) => {
      const change = item.status === 'SCHEDULED' ? '' : ` · ${item.status.replaceAll('_', ' ').toLowerCase()}`;
      return `${item.courseTitle} ${item.startTime}–${item.endTime} · ${item.buildingName} · Room ${item.room}${change}`;
    })
    .join('\n');
}
