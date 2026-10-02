import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { requireStudent } from '../common/student-access';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';
import { requiredScoreForTarget } from '../grades/grade-calculator';
import { ScheduleScope } from '../schedule/resolve-schedule';

@Injectable()
export class MeService {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  profile(user: AuthUser) {
    return this.data.getStudentProfile(requireStudent(user));
  }

  dashboard(user: AuthUser, now = new Date()) {
    return this.data.getDashboard(requireStudent(user), user.id, now);
  }

  async schedule(user: AuthUser, scope: ScheduleScope = 'today', now = new Date()) {
    return this.data.getStudentSchedule(requireStudent(user), scope, now);
  }

  courses(user: AuthUser) {
    return this.data.getStudentCourses(requireStudent(user));
  }

  async grades(user: AuthUser) {
    return this.data.getStudentGrades(requireStudent(user));
  }

  async calculate(user: AuthUser, courseId: string, target: number) {
    const grades = await this.data.getStudentGrades(requireStudent(user));
    const course = grades.find((item) => item.courseId === courseId);
    if (!course) throw new ForbiddenException('That course is not on your record');
    return {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      ...requiredScoreForTarget(
        course.assessments.map((item) => ({
          weight: item.weight,
          score: item.score,
          maxScore: item.maxScore,
          isFinal: item.isFinal,
        })),
        target,
      ),
    };
  }

  async attendance(user: AuthUser, courseQuery?: string) {
    return this.data.getStudentAttendance(requireStudent(user), courseQuery);
  }

  assignments(user: AuthUser) {
    return this.data.getStudentAssignments(requireStudent(user));
  }

  submitAssignment(user: AuthUser, assignmentId: string, body: string, now = new Date()) {
    return this.data.submitAssignment(requireStudent(user), assignmentId, body, now);
  }

  notifications(user: AuthUser) {
    return this.data.getStudentNotifications(user.id);
  }

  async markRead(user: AuthUser, notificationId: string) {
    const updated = await this.data.markNotificationRead(user.id, notificationId, new Date());
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async studentId(user: AuthUser) {
    const card = await this.data.getStudentIdCard(requireStudent(user));
    if (!card) throw new NotFoundException('Student ID card not found');
    return card;
  }

  assertScope(scope?: string): ScheduleScope {
    if (!scope) return 'today';
    if (scope === 'today' || scope === 'tomorrow' || scope === 'week' || scope === 'next') return scope;
    throw new BadRequestException('scope must be today, tomorrow, week, or next');
  }
}
