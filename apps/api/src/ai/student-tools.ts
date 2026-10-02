import { BMUDataProvider } from '../bmu/bmu-data.types';

/**
 * The only data surface the assistant is allowed to call.
 * Every method is bound to the authenticated student. There is no query,
 * filter, or identifier argument that can point at another student.
 */
export class StudentTools {
  constructor(
    private readonly data: BMUDataProvider,
    private readonly studentId: string,
    private readonly now: Date,
  ) {}

  getStudentSchedule(scope: 'today' | 'tomorrow' | 'week' | 'next' = 'today') {
    if (scope === 'next') return this.data.getNextClass(this.studentId, this.now);
    return this.data.getStudentSchedule(this.studentId, scope, this.now);
  }

  getStudentCourses() {
    return this.data.getStudentCourses(this.studentId);
  }

  getStudentGrades() {
    return this.data.getStudentGrades(this.studentId);
  }

  getStudentAttendance(courseQuery?: string) {
    return this.data.getStudentAttendance(this.studentId, courseQuery);
  }

  getStudentDeadlines() {
    return this.data.getStudentDeadlines(this.studentId, this.now);
  }

  getAcademicCalendar() {
    return this.data.getAcademicCalendar(this.now);
  }

  getCampusLocation(query: string) {
    return this.data.getCampusLocation(query);
  }
}

export const ALLOWED_TOOL_NAMES = [
  'getStudentSchedule',
  'getStudentCourses',
  'getStudentGrades',
  'getStudentAttendance',
  'getStudentDeadlines',
  'getAcademicCalendar',
  'getCampusLocation',
] as const;
