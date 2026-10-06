import { Role } from '@prisma/client';

/** Server-side permission names. The client must not be trusted to enforce these. */
export const Permissions = {
  ScheduleReadOwn: 'schedule.read.own',
  GradesReadOwn: 'grades.read.own',
  GradesManage: 'grades.manage',
  AttendanceReadOwn: 'attendance.read.own',
  AttendanceManage: 'attendance.manage',
  AssignmentsReadOwn: 'assignments.read.own',
  AssignmentsSubmitOwn: 'assignments.submit.own',
  AssignmentsManage: 'assignments.manage',
  CoursesReadOwn: 'courses.read.own',
  CoursesManage: 'courses.manage',
  NotificationsReadOwn: 'notifications.read.own',
  ProfileReadOwn: 'profile.read.own',
  ProfileManage: 'profile.manage',
  LibraryRead: 'library.read',
  LibraryLoansReadOwn: 'library.loans.read.own',
  LibraryManage: 'library.manage',
  DormitoryRead: 'dormitory.read',
  DormitoryApplicationReadOwn: 'dormitory.application.read.own',
  DormitoryApplicationWriteOwn: 'dormitory.application.write.own',
  DormitoryManage: 'dormitory.manage',
  SupportReadOwn: 'support.read.own',
  SupportWriteOwn: 'support.write.own',
  SupportManage: 'support.manage',
  CareerRead: 'career.read',
  CareerManage: 'career.manage',
  DiningRead: 'dining.read',
  DiningManage: 'dining.manage',
  ServicesRead: 'services.read',
  CalendarRead: 'calendar.read',
  CampusRead: 'campus.read',
  AnnouncementsManage: 'announcements.manage',
  UsersManage: 'users.manage',
  AuditRead: 'audit.read',
  FlagsManage: 'flags.manage',
  SyncManage: 'sync.manage',
  DeviceTokensManageOwn: 'device-tokens.manage.own',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const STUDENT_PERMISSIONS = new Set<string>([
  Permissions.ScheduleReadOwn,
  Permissions.GradesReadOwn,
  Permissions.AttendanceReadOwn,
  Permissions.AssignmentsReadOwn,
  Permissions.AssignmentsSubmitOwn,
  Permissions.CoursesReadOwn,
  Permissions.NotificationsReadOwn,
  Permissions.ProfileReadOwn,
  Permissions.LibraryRead,
  Permissions.LibraryLoansReadOwn,
  Permissions.DormitoryRead,
  Permissions.DormitoryApplicationReadOwn,
  Permissions.DormitoryApplicationWriteOwn,
  Permissions.SupportReadOwn,
  Permissions.SupportWriteOwn,
  Permissions.CareerRead,
  Permissions.DiningRead,
  Permissions.ServicesRead,
  Permissions.CalendarRead,
  Permissions.CampusRead,
  Permissions.DeviceTokensManageOwn,
]);

const TEACHER_PERMISSIONS = new Set<string>([
  Permissions.ScheduleReadOwn,
  Permissions.GradesManage,
  Permissions.AttendanceManage,
  Permissions.AssignmentsManage,
  Permissions.CoursesManage,
  Permissions.AnnouncementsManage,
  Permissions.ProfileReadOwn,
  Permissions.NotificationsReadOwn,
  Permissions.CampusRead,
  Permissions.CalendarRead,
  Permissions.CareerRead,
  Permissions.DiningRead,
  Permissions.ServicesRead,
  Permissions.LibraryRead,
  Permissions.DormitoryRead,
  Permissions.DeviceTokensManageOwn,
]);

const ADMIN_PERMISSIONS = new Set<string>([
  ...TEACHER_PERMISSIONS,
  Permissions.UsersManage,
  Permissions.AuditRead,
  Permissions.FlagsManage,
  Permissions.SyncManage,
  Permissions.LibraryManage,
  Permissions.DormitoryManage,
  Permissions.SupportManage,
  Permissions.CareerManage,
  Permissions.DiningManage,
  Permissions.ProfileManage,
]);

export function roleHasPermission(role: Role, permission: string): boolean {
  switch (role) {
    case Role.STUDENT:
      return STUDENT_PERMISSIONS.has(permission);
    case Role.TEACHER:
      return TEACHER_PERMISSIONS.has(permission);
    case Role.ADMIN:
      return ADMIN_PERMISSIONS.has(permission);
    default:
      return false;
  }
}
