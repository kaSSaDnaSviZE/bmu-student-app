import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentType,
  AttendanceStatus,
  Prisma,
  SubmissionStatus,
  SupportCategory,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GradeInput, summarizeGrades } from '../grades/grade-calculator';
import { bakuParts, dateOnlyUtc, greetingPeriod } from '../common/time';
import { ScheduleSource, ScheduleScope, selectSchedule } from '../schedule/resolve-schedule';
import {
  AcademicEventItem,
  AnnouncementItem,
  AssessmentItem,
  AssignmentItem,
  AttendanceSummary,
  BMUDataProvider,
  BuildingItem,
  CampusHit,
  ClassroomDetail,
  ClubItem,
  CourseDetail,
  CourseGrade,
  CourseSummary,
  Dashboard,
  DormitoryItem,
  EventItem,
  LibraryBookItem,
  MAP_NOTE,
  MaterialItem,
  NotificationItem,
  StudentIdCard,
  StudentProfile,
  SupportRequestItem,
} from './bmu-data.types';

const courseInclude = {
  teacher: { include: { user: true } },
  group: { include: { program: { include: { department: { include: { faculty: true } } } } } },
  schedules: {
    include: {
      classroom: { include: { building: true } },
      overrideClassroom: { include: { building: true } },
      overrideTeacher: { include: { user: true } },
    },
  },
} satisfies Prisma.CourseInclude;

type CourseRow = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

@Injectable()
export class MockBMUDataProvider implements BMUDataProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        program: { include: { department: { include: { faculty: true } } } },
        group: true,
      },
    });
    if (!student) return null;
    return {
      studentId: student.id,
      userId: student.userId,
      email: student.user.email,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      studentNo: student.studentNo,
      program: student.program.nameEn,
      programCode: student.program.code,
      group: student.group.code,
      faculty: student.program.department.faculty.nameEn,
      enrollmentYear: student.enrollmentYear,
      locale: student.user.locale,
    };
  }

  async getStudentSchedule(studentId: string, scope: ScheduleScope, now: Date) {
    const sources = await this.sourcesFor(studentId);
    return selectSchedule(sources, scope, bakuParts(now), now);
  }

  async getNextClass(studentId: string, now: Date) {
    const [next] = await this.getStudentSchedule(studentId, 'next', now);
    return next ?? null;
  }

  async getStudentCourses(studentId: string): Promise<CourseSummary[]> {
    const rows = await this.enrollments(studentId);
    return rows.map((row) => this.courseSummary(row.course));
  }

  async getCourseForStudent(studentId: string, courseId: string): Promise<CourseDetail | null> {
    const row = await this.enrollment(studentId, courseId);
    if (!row) return null;
    const now = new Date();
    const schedule = selectSchedule(row.course.schedules.map((slot) => this.toSource(row.course, slot)), 'week', bakuParts(now), now);
    const materials = await this.materials(courseId);
    const assignments = await this.assignmentsFor(studentId, [courseId]);
    const grades = (await this.getStudentGrades(studentId)).find((grade) => grade.courseId === courseId);
    const attendance = (await this.getStudentAttendance(studentId)).find((item) => item.courseId === courseId);
    const announcements = await this.prisma.announcement.findMany({
      where: { courseId },
      orderBy: { publishedAt: 'desc' },
    });
    return {
      ...this.courseSummary(row.course),
      description: row.course.descriptionEn,
      schedule,
      materials,
      assignments,
      grades: grades ?? emptyGrade(row.course),
      attendance: attendance ?? emptyAttendance(row.course),
      announcements: announcements.map(mapAnnouncement),
    };
  }

  async getCourseMaterials(studentId: string, courseId: string) {
    if (!(await this.enrollment(studentId, courseId))) return null;
    return this.materials(courseId);
  }

  async getCourseAssignments(studentId: string, courseId: string) {
    if (!(await this.enrollment(studentId, courseId))) return null;
    return this.assignmentsFor(studentId, [courseId]);
  }

  async getStudentGrades(studentId: string): Promise<CourseGrade[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            assessments: {
              include: { grades: { where: { studentId } } },
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    });
    return rows.map((row) => {
      const assessments: AssessmentItem[] = row.course.assessments.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        weight: assessment.weight,
        maxScore: assessment.maxScore,
        score: assessment.grades[0]?.score ?? null,
        date: assessment.date ? assessment.date.toISOString() : null,
        isFinal: assessment.type === AssessmentType.FINAL,
      }));
      const inputs: GradeInput[] = assessments.map((item) => ({
        weight: item.weight,
        score: item.score,
        maxScore: item.maxScore,
        isFinal: item.isFinal,
      }));
      return {
        courseId: row.course.id,
        courseCode: row.course.code,
        courseTitle: row.course.titleEn,
        summary: summarizeGrades(inputs),
        assessments,
      };
    });
  }

  async getStudentAttendance(studentId: string, courseQuery?: string): Promise<AttendanceSummary[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        course: { include: { attendance: { where: { studentId } } } },
      },
    });
    const needle = courseQuery?.trim().toLowerCase();
    return rows
      .map((row) => summarizeAttendance(row.course.id, row.course.code, row.course.titleEn, row.course.attendance))
      .filter((item) => {
        if (!needle) return true;
        return (
          item.courseTitle.toLowerCase().includes(needle) ||
          item.courseCode.toLowerCase().includes(needle) ||
          (needle.startsWith('math') && item.courseTitle.toLowerCase().includes('math'))
        );
      });
  }

  async getStudentDeadlines(studentId: string, now: Date): Promise<AssignmentItem[]> {
    const items = await this.getStudentAssignments(studentId);
    const start = dateOnlyUtc(bakuParts(now)).getTime();
    const end = start + 8 * 86400000;
    return items
      .filter((item) => {
        const deadline = new Date(item.deadline).getTime();
        const upcoming = deadline >= start && deadline < end;
        const overdue = deadline < now.getTime() && item.status === SubmissionStatus.NOT_SUBMITTED;
        return upcoming || overdue;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  async getStudentAssignments(studentId: string): Promise<AssignmentItem[]> {
    const enrolled = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      select: { courseId: true },
    });
    return this.assignmentsFor(
      studentId,
      enrolled.map((row) => row.courseId),
    );
  }

  async submitAssignment(studentId: string, assignmentId: string, body: string, now: Date) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    const enrolled = await this.enrollment(studentId, assignment.courseId);
    if (!enrolled) throw new ForbiddenException('You are not enrolled in this course');
    const late = now.getTime() > assignment.deadline.getTime();
    const saved = await this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      create: {
        assignmentId,
        studentId,
        body,
        status: late ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
        submittedAt: now,
      },
      update: {
        body,
        status: late ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
        submittedAt: now,
      },
    });
    return {
      id: assignment.id,
      courseId: assignment.courseId,
      courseCode: assignment.course.code,
      courseTitle: assignment.course.titleEn,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline.toISOString(),
      maxScore: assignment.maxScore,
      status: saved.status,
      submittedAt: saved.submittedAt?.toISOString() ?? null,
      score: saved.score,
    };
  }

  async getStudentNotifications(userId: string): Promise<NotificationItem[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      read: row.readAt != null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(userId: string, notificationId: string, now: Date) {
    const row = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!row || row.userId !== userId) return null;
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: row.readAt ?? now },
    });
    return {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      body: updated.body,
      read: true,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async getAnnouncements(studentId: string): Promise<AnnouncementItem[]> {
    const enrolled = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      select: { courseId: true },
    });
    const courseIds = enrolled.map((row) => row.courseId);
    const rows = await this.prisma.announcement.findMany({
      where: {
        OR: [{ audience: 'UNIVERSITY' }, { courseId: { in: courseIds } }],
      },
      include: { course: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
    return rows.map((row) => ({
      ...mapAnnouncement(row),
      courseCode: row.course?.code ?? null,
    }));
  }

  async getAcademicCalendar(): Promise<AcademicEventItem[]> {
    const rows = await this.prisma.academicEvent.findMany({ orderBy: { startsAt: 'asc' } });
    return rows.map((row) => ({
      id: row.id,
      title: row.titleEn,
      titleEn: row.titleEn,
      titleAz: row.titleAz,
      titleRu: row.titleRu,
      type: row.type,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      description: row.descriptionEn,
    }));
  }

  async getBuildings(): Promise<BuildingItem[]> {
    const rows = await this.prisma.building.findMany({
      include: { classrooms: { orderBy: { code: 'asc' } } },
      orderBy: { code: 'asc' },
    });
    return rows.map(mapBuilding);
  }

  async getClassroom(id: string): Promise<ClassroomDetail | null> {
    const row = await this.prisma.classroom.findUnique({
      where: { id },
      include: { building: { include: { classrooms: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      floor: row.floor,
      capacity: row.capacity,
      building: mapBuilding(row.building),
    };
  }

  async getCampusLocation(query: string): Promise<CampusHit[]> {
    const q = query.toLowerCase();
    const roomMatch = q.match(/\b(\d{2,4}[a-z]?)\b/i);
    const hits: CampusHit[] = [];
    if (roomMatch) {
      const rooms = await this.prisma.classroom.findMany({
        where: { code: { equals: roomMatch[1], mode: 'insensitive' } },
        include: { building: true },
      });
      for (const room of rooms) {
        hits.push({
          kind: 'classroom',
          id: room.id,
          label: `${room.building.nameEn} · Room ${room.code}`,
          buildingCode: room.building.code,
          buildingName: room.building.nameEn,
          room: room.code,
          floor: room.floor,
          latitude: room.building.latitude,
          longitude: room.building.longitude,
          mapReady: false,
          note: MAP_NOTE,
        });
      }
    }
    const buildings = await this.prisma.building.findMany();
    for (const building of buildings) {
      const hay = `${building.code} ${building.nameEn} ${building.kind} ${building.descriptionEn ?? ''}`.toLowerCase();
      if (hay.includes(q) || q.includes(building.nameEn.toLowerCase()) || q.includes(building.kind.toLowerCase())) {
        hits.push({
          kind: 'building',
          id: building.id,
          label: building.nameEn,
          buildingCode: building.code,
          buildingName: building.nameEn,
          room: null,
          floor: null,
          latitude: building.latitude,
          longitude: building.longitude,
          mapReady: false,
          note: MAP_NOTE,
        });
      }
    }
    return hits;
  }

  async getLibrary(): Promise<LibraryBookItem[]> {
    const rows = await this.prisma.libraryBook.findMany({ orderBy: { title: 'asc' } });
    return rows.map((row) => ({
      id: row.id,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
      copies: row.copies,
      available: row.available,
    }));
  }

  async getDormitories(): Promise<DormitoryItem[]> {
    const rows = await this.prisma.dormitory.findMany({
      include: { building: true, rooms: { orderBy: { number: 'asc' } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      buildingCode: row.building.code,
      rooms: row.rooms.map((room) => ({
        id: room.id,
        number: room.number,
        capacity: room.capacity,
        occupied: room.occupied,
      })),
    }));
  }

  async getEvents(userId: string): Promise<EventItem[]> {
    const rows = await this.prisma.universityEvent.findMany({
      include: {
        club: true,
        registrations: true,
      },
      orderBy: { startsAt: 'asc' },
    });
    return rows.map((row) => mapEvent(row, userId));
  }

  async getEvent(userId: string, eventId: string) {
    const row = await this.prisma.universityEvent.findUnique({
      where: { id: eventId },
      include: { club: true, registrations: true },
    });
    return row ? mapEvent(row, userId) : null;
  }

  async registerForEvent(userId: string, eventId: string) {
    const event = await this.getEvent(userId, eventId);
    if (!event) throw new NotFoundException('Event not found');
    const active = event.registeredCount;
    if (event.capacity != null && active >= event.capacity && !event.registered) {
      throw new ConflictException('This event is full');
    }
    await this.prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: 'REGISTERED' },
      update: { status: 'REGISTERED' },
    });
    const updated = await this.getEvent(userId, eventId);
    if (!updated) throw new NotFoundException('Event not found');
    return updated;
  }

  async unregisterFromEvent(userId: string, eventId: string) {
    if (!(await this.getEvent(userId, eventId))) throw new NotFoundException('Event not found');
    await this.prisma.eventRegistration.updateMany({
      where: { eventId, userId },
      data: { status: 'CANCELLED' },
    });
    const updated = await this.getEvent(userId, eventId);
    if (!updated) throw new NotFoundException('Event not found');
    return updated;
  }

  async getClubs(userId: string): Promise<ClubItem[]> {
    const rows = await this.prisma.club.findMany({
      include: {
        memberships: true,
        events: { include: { club: true, registrations: true }, orderBy: { startsAt: 'asc' } },
      },
      orderBy: { nameEn: 'asc' },
    });
    return rows.map((row) => mapClub(row, userId));
  }

  async getClub(userId: string, clubId: string) {
    const row = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: true,
        events: { include: { club: true, registrations: true }, orderBy: { startsAt: 'asc' } },
      },
    });
    return row ? mapClub(row, userId) : null;
  }

  async joinClub(userId: string, clubId: string) {
    if (!(await this.prisma.club.findUnique({ where: { id: clubId } }))) {
      throw new NotFoundException('Club not found');
    }
    await this.prisma.clubMembership.upsert({
      where: { clubId_userId: { clubId, userId } },
      create: { clubId, userId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', leftAt: null },
    });
    const club = await this.getClub(userId, clubId);
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async leaveClub(userId: string, clubId: string) {
    if (!(await this.prisma.club.findUnique({ where: { id: clubId } }))) {
      throw new NotFoundException('Club not found');
    }
    await this.prisma.clubMembership.updateMany({
      where: { clubId, userId },
      data: { status: 'LEFT', leftAt: new Date() },
    });
    const club = await this.getClub(userId, clubId);
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async getStudentIdCard(studentId: string): Promise<StudentIdCard | null> {
    const card = await this.prisma.studentID.findUnique({
      where: { studentId },
      include: { student: { include: { user: true, program: true } } },
    });
    if (!card) return null;
    return {
      demoOnly: true,
      disclaimer:
        'Demo digital ID. This is not an official Baku Engineering University credential and cannot be used for campus access.',
      cardNumber: card.cardNumber,
      studentNo: card.student.studentNo,
      firstName: card.student.user.firstName,
      lastName: card.student.user.lastName,
      program: card.student.program.nameEn,
      qrPayload: `bmu-demo:student:${card.student.studentNo}`,
      issuedAt: card.issuedAt.toISOString(),
      expiresAt: card.expiresAt.toISOString(),
    };
  }

  async getDashboard(studentId: string, userId: string, now: Date): Promise<Dashboard> {
    const profile = await this.getStudentProfile(studentId);
    if (!profile) throw new NotFoundException('Student not found');
    const [nextClass, today, deadlines, attendance, announcements, notifications] = await Promise.all([
      this.getNextClass(studentId, now),
      this.getStudentSchedule(studentId, 'today', now),
      this.getStudentDeadlines(studentId, now),
      this.getStudentAttendance(studentId),
      this.getAnnouncements(studentId),
      this.getStudentNotifications(userId),
    ]);
    return {
      period: greetingPeriod(bakuParts(now).hour),
      profile,
      nextClass,
      today,
      deadlines: deadlines.slice(0, 5),
      attendance,
      announcements: announcements.slice(0, 4),
      unreadNotifications: notifications.filter((item) => !item.read).length,
    };
  }

  async listSupportRequests(userId: string): Promise<SupportRequestItem[]> {
    const rows = await this.prisma.supportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapSupport);
  }

  async createSupportRequest(userId: string, input: { category: string; subject: string; message: string }) {
    const created = await this.prisma.supportRequest.create({
      data: {
        userId,
        category: input.category as SupportCategory,
        subject: input.subject,
        message: input.message,
      },
    });
    return mapSupport(created);
  }

  private async sourcesFor(studentId: string): Promise<ScheduleSource[]> {
    const rows = await this.enrollments(studentId);
    return rows.flatMap((row) => row.course.schedules.map((slot) => this.toSource(row.course, slot)));
  }

  private enrollments(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: { course: { include: courseInclude } },
    });
  }

  private enrollment(studentId: string, courseId: string) {
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: { course: { include: courseInclude } },
    });
  }

  private courseSummary(course: CourseRow): CourseSummary {
    return {
      id: course.id,
      code: course.code,
      title: course.titleEn,
      titleEn: course.titleEn,
      titleAz: course.titleAz,
      titleRu: course.titleRu,
      credits: course.credits,
      semester: course.semester,
      teacherName: personName(course.teacher.title, course.teacher.user.firstName, course.teacher.user.lastName),
      groupCode: course.group.code,
    };
  }

  private toSource(course: CourseRow, slot: CourseRow['schedules'][number]): ScheduleSource {
    return {
      id: slot.id,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.titleEn,
      teacherName: personName(course.teacher.title, course.teacher.user.firstName, course.teacher.user.lastName),
      weekday: slot.weekday,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      note: slot.note,
      exceptionDate: slot.exceptionDate,
      exceptionStatus: slot.exceptionStatus,
      exceptionNote: slot.exceptionNote,
      buildingCode: slot.classroom.building.code,
      buildingName: slot.classroom.building.nameEn,
      room: slot.classroom.code,
      overrideBuildingCode: slot.overrideClassroom?.building.code ?? null,
      overrideBuildingName: slot.overrideClassroom?.building.nameEn ?? null,
      overrideRoom: slot.overrideClassroom?.code ?? null,
      overrideStartTime: slot.overrideStartTime,
      overrideEndTime: slot.overrideEndTime,
      overrideTeacherName: slot.overrideTeacher
        ? personName(slot.overrideTeacher.title, slot.overrideTeacher.user.firstName, slot.overrideTeacher.user.lastName)
        : null,
    };
  }

  private async materials(courseId: string): Promise<MaterialItem[]> {
    const rows = await this.prisma.courseMaterial.findMany({ where: { courseId }, orderBy: { title: 'asc' } });
    return rows.map((row) => ({ id: row.id, title: row.title, type: row.type, url: row.url }));
  }

  private async assignmentsFor(studentId: string, courseIds: string[]): Promise<AssignmentItem[]> {
    if (courseIds.length === 0) return [];
    const rows = await this.prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: true,
        submissions: { where: { studentId } },
      },
      orderBy: { deadline: 'asc' },
    });
    return rows.map((row) => {
      const submission = row.submissions[0];
      return {
        id: row.id,
        courseId: row.courseId,
        courseCode: row.course.code,
        courseTitle: row.course.titleEn,
        title: row.title,
        description: row.description,
        deadline: row.deadline.toISOString(),
        maxScore: row.maxScore,
        status: submission?.status ?? SubmissionStatus.NOT_SUBMITTED,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
        score: submission?.score ?? null,
      };
    });
  }
}

function personName(title: string, first: string, last: string): string {
  return `${title} ${first} ${last}`.replace(/\s+/g, ' ').trim();
}

function summarizeAttendance(
  courseId: string,
  courseCode: string,
  courseTitle: string,
  records: { status: AttendanceStatus }[],
): AttendanceSummary {
  const present = records.filter((row) => row.status === AttendanceStatus.PRESENT).length;
  const absent = records.filter((row) => row.status === AttendanceStatus.ABSENT).length;
  const late = records.filter((row) => row.status === AttendanceStatus.LATE).length;
  const excused = records.filter((row) => row.status === AttendanceStatus.EXCUSED).length;
  const denominator = present + absent + late;
  return {
    courseId,
    courseCode,
    courseTitle,
    present,
    absent,
    late,
    excused,
    percent: denominator === 0 ? null : Math.round(((present + late) / denominator) * 100),
  };
}

function emptyGrade(course: { id: string; code: string; titleEn: string }): CourseGrade {
  return {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.titleEn,
    summary: summarizeGrades([]),
    assessments: [],
  };
}

function emptyAttendance(course: { id: string; code: string; titleEn: string }): AttendanceSummary {
  return summarizeAttendance(course.id, course.code, course.titleEn, []);
}

function mapAnnouncement(row: {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: Date;
  course?: { code: string } | null;
}): AnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    courseCode: row.course?.code ?? null,
    publishedAt: row.publishedAt.toISOString(),
  };
}

function mapBuilding(row: {
  id: string;
  code: string;
  nameEn: string;
  nameAz: string;
  nameRu: string;
  kind: string;
  latitude: number | null;
  longitude: number | null;
  descriptionEn: string | null;
  classrooms: { id: string; code: string; name: string; floor: number; capacity: number }[];
}): BuildingItem {
  return {
    id: row.id,
    code: row.code,
    name: row.nameEn,
    nameEn: row.nameEn,
    nameAz: row.nameAz,
    nameRu: row.nameRu,
    kind: row.kind,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.descriptionEn,
    classrooms: row.classrooms.map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
    })),
  };
}

function mapEvent(
  row: {
    id: string;
    titleEn: string;
    titleAz: string;
    titleRu: string;
    descriptionEn: string;
    location: string;
    startsAt: Date;
    endsAt: Date;
    capacity: number | null;
    clubId: string | null;
    club: { nameEn: string } | null;
    registrations: { userId: string; status: string }[];
  },
  userId: string,
): EventItem {
  const active = row.registrations.filter((item) => item.status === 'REGISTERED');
  return {
    id: row.id,
    title: row.titleEn,
    titleEn: row.titleEn,
    titleAz: row.titleAz,
    titleRu: row.titleRu,
    description: row.descriptionEn,
    location: row.location,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    capacity: row.capacity,
    registeredCount: active.length,
    clubId: row.clubId,
    clubName: row.club?.nameEn ?? null,
    registered: active.some((item) => item.userId === userId),
  };
}

function mapClub(
  row: {
    id: string;
    nameEn: string;
    nameAz: string;
    nameRu: string;
    descriptionEn: string;
    category: string;
    memberships: { userId: string; status: string }[];
    events: Parameters<typeof mapEvent>[0][];
  },
  userId: string,
): ClubItem {
  const active = row.memberships.filter((item) => item.status === 'ACTIVE');
  return {
    id: row.id,
    name: row.nameEn,
    nameEn: row.nameEn,
    nameAz: row.nameAz,
    nameRu: row.nameRu,
    description: row.descriptionEn,
    category: row.category,
    memberCount: active.length,
    joined: active.some((item) => item.userId === userId),
    events: row.events.map((event) => mapEvent(event, userId)),
  };
}

function mapSupport(row: {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}): SupportRequestItem {
  return {
    id: row.id,
    category: row.category,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
