import {
  AcademicEventType,
  AssessmentType,
  AttendanceStatus,
  BuildingKind,
  ClassStatus,
  DormApplicationStatus,
  LibraryLoanStatus,
  MaterialType,
  NotificationType,
  PrismaClient,
  Role,
  SemesterTerm,
  StudentServiceKind,
  SubmissionStatus,
  SyncStatus,
  Weekday,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PASSWORD = 'DemoPass123!';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function bakuToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baku',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const bag: Record<string, string> = {};
  for (const part of parts) if (part.type !== 'literal') bag[part.type] = part.value;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    weekday: WEEKDAY_INDEX[bag.weekday] ?? 1,
  };
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(year: number, month: number, day: number, days: number) {
  const value = dateOnly(year, month, day);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function endOfBakuDay(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 19, 59, 0));
}

async function wipe() {
  await prisma.supportMessage.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.clubMembership.deleteMany();
  await prisma.universityEvent.deleteMany();
  await prisma.club.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.storedObject.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.courseMaterial.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseOffering.deleteMany();
  await prisma.attendancePolicy.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseCatalog.deleteMany();
  await prisma.studentID.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.libraryLoan.deleteMany();
  await prisma.libraryReservation.deleteMany();
  await prisma.dormApplication.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuDay.deleteMany();
  await prisma.diningVenue.deleteMany();
  await prisma.dormitoryRoom.deleteMany();
  await prisma.dormitory.deleteMany();
  await prisma.libraryBook.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.building.deleteMany();
  await prisma.academicEvent.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.careerOpportunity.deleteMany();
  await prisma.careerEvent.deleteMany();
  await prisma.careerResource.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.studentServiceInfo.deleteMany();
  await prisma.group.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await wipe();
  const today = bakuToday();

  const faculties = await Promise.all(
    [
      ['FIT', 'Faculty of Information Technologies', 'İnformasiya Texnologiyaları Fakültəsi', 'Факультет информационных технологий'],
      ['ENG', 'Faculty of Engineering', 'Mühəndislik Fakültəsi', 'Инженерный факультет'],
      ['ECAS', 'Faculty of Economics and Administrative Sciences', 'İqtisadiyyat və İnzibati Elmlər Fakültəsi', 'Факультет экономики и управления'],
      ['ARCH', 'Faculty of Architecture and Construction', 'Memarlıq və İnşaat Fakültəsi', 'Факультет архитектуры и строительства'],
    ].map(([code, nameEn, nameAz, nameRu]) =>
      prisma.faculty.create({ data: { code, nameEn, nameAz, nameRu } }),
    ),
  );
  const facultyId = Object.fromEntries(faculties.map((item) => [item.code, item.id]));

  const departments = await Promise.all(
    [
      ['CE', 'FIT', 'Department of Computer Engineering', 'Kompüter mühəndisliyi kafedrası', 'Кафедра компьютерной инженерии'],
      ['IS', 'FIT', 'Department of Information Systems', 'İnformasiya sistemləri kafedrası', 'Кафедра информационных систем'],
      ['LANG', 'FIT', 'Department of Languages', 'Dillər kafedrası', 'Кафедра языков'],
      ['PHY', 'ENG', 'Department of Physics', 'Fizika kafedrası', 'Кафедра физики'],
      ['MATH', 'ENG', 'Department of Mathematics', 'Riyaziyyat kafedrası', 'Кафедра математики'],
      ['ECO', 'ECAS', 'Department of Economics', 'İqtisadiyyat kafedrası', 'Кафедра экономики'],
      ['ARC', 'ARCH', 'Department of Architecture', 'Memarlıq kafedrası', 'Кафедра архитектуры'],
    ].map(([code, faculty, nameEn, nameAz, nameRu]) =>
      prisma.department.create({
        data: { code, facultyId: facultyId[faculty], nameEn, nameAz, nameRu },
      }),
    ),
  );
  const departmentId = Object.fromEntries(departments.map((item) => [item.code, item.id]));

  const programs = await Promise.all(
    [
      ['CE', 'CE', 'Computer Engineering', 'Kompüter mühəndisliyi', 'Компьютерная инженерия'],
      ['IT', 'IS', 'Information Technology', 'İnformasiya texnologiyaları', 'Информационные технологии'],
      ['ARCH', 'ARC', 'Architecture', 'Memarlıq', 'Архитектура'],
    ].map(([code, department, nameEn, nameAz, nameRu]) =>
      prisma.program.create({
        data: {
          code,
          departmentId: departmentId[department],
          nameEn,
          nameAz,
          nameRu,
          degreeLevel: 'Bachelor',
          durationYears: 4,
        },
      }),
    ),
  );
  const programId = Object.fromEntries(programs.map((item) => [item.code, item.id]));

  const groups = await Promise.all(
    [
      ['CE-2201', 'CE', 2],
      ['CE-2202', 'CE', 2],
      ['IT-2301', 'IT', 1],
      ['ARCH-2201', 'ARCH', 2],
    ].map(([code, program, year]) =>
      prisma.group.create({
        data: { code: code as string, programId: programId[program as string], year: year as number },
      }),
    ),
  );
  const groupId = Object.fromEntries(groups.map((item) => [item.code, item.id]));

  const base = { latitude: 40.4743, longitude: 49.72744 };
  const buildingDefs: [string, string, string, string, BuildingKind, number, number, string][] = [
    ['A', 'Building A', 'A bina', 'Корпус A', BuildingKind.ACADEMIC, 0.0003, -0.0002, 'Lecture rooms'],
    ['B', 'Building B', 'B bina', 'Корпус B', BuildingKind.ACADEMIC, -0.0002, 0.0004, 'Computer engineering classrooms, including room 304'],
    ['C', 'Building C', 'C bina', 'Корпус C', BuildingKind.ACADEMIC, -0.0005, -0.0004, 'Laboratories'],
    ['LIB', 'Library', 'Kitabxana', 'Библиотека', BuildingKind.LIBRARY, 0.0006, 0.0002, 'Main library'],
    ['CAF', 'Cafeteria', 'Yeməkxana', 'Столовая', BuildingKind.CAFETERIA, 0.0001, 0.0007, 'Student cafeteria'],
    ['GYM', 'Gym', 'İdman zalı', 'Спортзал', BuildingKind.GYM, -0.0007, 0.0005, 'Sports hall'],
    ['ADM', 'Administration', 'İnzibati bina', 'Администрация', BuildingKind.ADMINISTRATION, 0.0004, -0.0006, 'Rectorate and student affairs'],
    ['D1', 'Dormitory 1', 'Yataqxana 1', 'Общежитие 1', BuildingKind.DORMITORY, -0.001, 0.0008, 'Student residence'],
    ['D2', 'Dormitory 2', 'Yataqxana 2', 'Общежитие 2', BuildingKind.DORMITORY, -0.0012, 0.001, 'Student residence'],
  ];
  const buildings = await Promise.all(
    buildingDefs.map(([code, nameEn, nameAz, nameRu, kind, dLat, dLng, descriptionEn]) =>
      prisma.building.create({
        data: {
          code,
          nameEn,
          nameAz,
          nameRu,
          kind,
          latitude: base.latitude + dLat,
          longitude: base.longitude + dLng,
          descriptionEn,
        },
      }),
    ),
  );
  const buildingId = Object.fromEntries(buildings.map((item) => [item.code, item.id]));

  const roomDefs: [string, string, string, number, number][] = [
    ['A', '105', 'English classroom', 1, 40],
    ['B', '201', 'Mathematics classroom', 2, 48],
    ['B', '210', 'Seminar room', 2, 32],
    ['B', '212', 'Seminar room', 2, 32],
    ['B', '304', 'Programming lab', 3, 30],
    ['C', '110', 'Physics lab', 1, 24],
    ['C', '210', 'Physics studio', 2, 24],
  ];
  const rooms = await Promise.all(
    roomDefs.map(([building, code, name, floor, capacity]) =>
      prisma.classroom.create({
        data: { buildingId: buildingId[building], code, name, floor, capacity },
      }),
    ),
  );
  const roomId = Object.fromEntries(rooms.map((item) => [`${item.buildingId}:${item.code}`, item.id]));
  const room = (building: string, code: string) => roomId[`${buildingId[building]}:${code}`];

  const admin = await prisma.user.create({
    data: {
      email: 'demo.admin@bmu.example',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Demo',
      staffRole: 'REGISTRAR',
    },
  });

  const teacherUsers = await Promise.all(
    [
      ['demo.teacher@bmu.example', 'Leyla', 'Demo', 'CE', 'Dr.', 'EMP-1001', 'B-305'],
      ['teacher.math@bmu.example', 'Rashad', 'Demo', 'MATH', 'Dr.', 'EMP-1002', 'A-220'],
      ['teacher.physics@bmu.example', 'Kamran', 'Demo', 'PHY', 'Dr.', 'EMP-1003', 'C-112'],
      ['teacher.english@bmu.example', 'Sevinc', 'Demo', 'LANG', 'Ms.', 'EMP-1004', 'A-110'],
      ['teacher.systems@bmu.example', 'Tural', 'Demo', 'CE', 'Dr.', 'EMP-1005', 'B-310'],
    ].map(([email, firstName, lastName, department, title, employeeNo, office]) =>
      prisma.user
        .create({
          data: { email, passwordHash, role: Role.TEACHER, firstName, lastName },
        })
        .then((user) =>
          prisma.teacher.create({
            data: {
              userId: user.id,
              departmentId: departmentId[department],
              title,
              employeeNo,
              office,
            },
          }),
        ),
    ),
  );
  const teacher = {
    leyla: teacherUsers[0].id,
    rashad: teacherUsers[1].id,
    kamran: teacherUsers[2].id,
    sevinc: teacherUsers[3].id,
    tural: teacherUsers[4].id,
  };

  const firstNames = ['Alex', 'Nigar', 'Elvin', 'Aysel', 'Murad', 'Gunel', 'Rauf', 'Lala', 'Samir', 'Narmin', 'Kanan', 'Fidan', 'Orkhan', 'Aylin', 'Emil', 'Sabina', 'Vugar', 'Nazrin', 'Toghrul', 'Amina'];
  const studentPlan: [string, string, string][] = [];
  for (let index = 0; index < 20; index += 1) {
    const email = index === 0 ? 'demo.student@bmu.example' : `student${String(index + 1).padStart(2, '0')}@bmu.example`;
    const group = index < 8 ? 'CE-2201' : index < 14 ? 'CE-2202' : index < 18 ? 'IT-2301' : 'ARCH-2201';
    const program = group.startsWith('CE') ? 'CE' : group.startsWith('IT') ? 'IT' : 'ARCH';
    studentPlan.push([email, firstNames[index], group + '|' + program]);
  }

  const dorm1 = await prisma.dormitory.create({
    data: { buildingId: buildingId.D1, name: 'Dormitory 1', gender: 'mixed' },
  });
  const dorm2 = await prisma.dormitory.create({
    data: { buildingId: buildingId.D2, name: 'Dormitory 2', gender: 'mixed' },
  });
  const dormRooms = await Promise.all(
    [
      [dorm1.id, '101'],
      [dorm1.id, '102'],
      [dorm2.id, '201'],
    ].map(([dormitoryId, number]) =>
      prisma.dormitoryRoom.create({ data: { dormitoryId, number, capacity: 2, occupied: 0 } }),
    ),
  );

  const students = [];
  for (let index = 0; index < studentPlan.length; index += 1) {
    const [email, firstName, meta] = studentPlan[index];
    const [groupCode, programCode] = meta.split('|');
    const user = await prisma.user.create({
      data: { email, passwordHash, role: Role.STUDENT, firstName, lastName: 'Demo', locale: index % 5 === 0 ? 'az' : 'en' },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        programId: programId[programCode],
        groupId: groupId[groupCode],
        studentNo: `BMU2022${String(index + 1).padStart(4, '0')}`,
        enrollmentYear: groupCode.includes('2301') ? 2023 : 2022,
        dormRoomId: index > 0 && index < 4 ? dormRooms[index - 1].id : null,
      },
    });
    await prisma.studentID.create({
      data: {
        studentId: student.id,
        cardNumber: `DEMO-${student.studentNo}`,
        issuedAt: new Date('2025-09-15T00:00:00.000Z'),
        expiresAt: new Date('2029-09-15T00:00:00.000Z'),
        demoOnly: true,
      },
    });
    students.push({ ...student, userId: user.id, firstName, groupCode, email });
  }
  await prisma.dormitoryRoom.update({ where: { id: dormRooms[0].id }, data: { occupied: 1 } });
  await prisma.dormitoryRoom.update({ where: { id: dormRooms[1].id }, data: { occupied: 1 } });
  await prisma.dormitoryRoom.update({ where: { id: dormRooms[2].id }, data: { occupied: 1 } });

  const courseDefs: [string, string, string, string, number, string, string, string][] = [
    ['CS201', 'Programming', 'Proqramlaşdırma', 'Программирование', 6, 'CE-2201', teacher.leyla, 'Introductory programming for engineers.'],
    ['MATH101', 'Mathematics', 'Riyaziyyat', 'Математика', 5, 'CE-2201', teacher.rashad, 'Calculus and linear algebra for engineers.'],
    ['PHY110', 'Physics', 'Fizika', 'Физика', 5, 'CE-2201', teacher.kamran, 'Mechanics, waves and introductory lab work.'],
    ['ENG101', 'English', 'İngilis dili', 'Английский язык', 3, 'CE-2201', teacher.sevinc, 'Academic English.'],
    ['CS210', 'Data Structures', 'Verilənlər strukturları', 'Структуры данных', 6, 'CE-2201', teacher.leyla, 'Lists, trees, graphs and complexity.'],
    ['CS230', 'Databases', 'Verilənlər bazaları', 'Базы данных', 5, 'CE-2201', teacher.tural, 'Relational modeling and SQL.'],
    ['CS250', 'Web Technologies', 'Veb texnologiyalar', 'Веб-технологии', 5, 'CE-2202', teacher.tural, 'Web application fundamentals.'],
    ['MATH210', 'Discrete Mathematics', 'Diskret riyaziyyat', 'Дискретная математика', 5, 'CE-2202', teacher.rashad, 'Logic, sets and combinatorics.'],
    ['CS260', 'Computer Organization', 'Kompüterin təşkili', 'Организация ЭВМ', 5, 'CE-2202', teacher.leyla, 'Digital logic and machine organization.'],
    ['CS270', 'Algorithms', 'Alqoritmlər', 'Алгоритмы', 6, 'CE-2202', teacher.tural, 'Algorithm design and analysis.'],
    ['IT101', 'Information Systems', 'İnformasiya sistemləri', 'Информационные системы', 5, 'IT-2301', teacher.tural, 'How organizations use information systems.'],
    ['ARCH110', 'Engineering Graphics', 'Mühəndis qrafikası', 'Инженерная графика', 4, 'ARCH-2201', teacher.kamran, 'Technical drawing studio.'],
  ];

  const courses = [];
  for (const [code, titleEn, titleAz, titleRu, credits, groupCode, teacherId, descriptionEn] of courseDefs) {
    const course = await prisma.course.create({
      data: {
        code,
        titleEn,
        titleAz,
        titleRu,
        credits,
        semester: '2026-FALL',
        teacherId,
        groupId: groupId[groupCode],
        descriptionEn,
      },
    });
    courses.push({ ...course, groupCode });
  }
  const courseByCode = Object.fromEntries(courses.map((item) => [item.code, item]));

  const slots: [string, Weekday, string, string, string, string][] = [
    ['MATH101', Weekday.MONDAY, '09:00', '10:20', 'B', '201'],
    ['CS201', Weekday.MONDAY, '10:30', '11:50', 'B', '304'],
    ['PHY110', Weekday.MONDAY, '12:10', '13:30', 'C', '110'],
    ['ENG101', Weekday.MONDAY, '14:00', '15:20', 'A', '105'],
    ['CS210', Weekday.TUESDAY, '09:00', '10:20', 'B', '210'],
    ['CS230', Weekday.TUESDAY, '10:30', '11:50', 'B', '212'],
    ['PHY110', Weekday.WEDNESDAY, '12:00', '13:20', 'C', '110'],
    ['CS201', Weekday.THURSDAY, '10:00', '11:30', 'B', '304'],
    ['MATH101', Weekday.FRIDAY, '09:00', '10:20', 'B', '201'],
    ['CS210', Weekday.FRIDAY, '10:30', '11:50', 'B', '210'],
    ['CS230', Weekday.FRIDAY, '12:00', '13:20', 'B', '212'],
    ['ENG101', Weekday.FRIDAY, '14:00', '15:20', 'A', '105'],
    ['CS250', Weekday.MONDAY, '09:00', '10:20', 'B', '212'],
    ['MATH210', Weekday.TUESDAY, '12:00', '13:20', 'A', '105'],
    ['CS260', Weekday.WEDNESDAY, '09:00', '10:20', 'B', '201'],
    ['CS270', Weekday.THURSDAY, '14:00', '15:20', 'B', '304'],
    ['IT101', Weekday.TUESDAY, '14:00', '15:20', 'A', '105'],
    ['ARCH110', Weekday.WEDNESDAY, '10:30', '12:30', 'C', '210'],
  ];

  const englishFriday = dateOnly(today.year, today.month, today.day);
  const daysUntilFriday = (5 - today.weekday + 7) % 7;
  englishFriday.setUTCDate(englishFriday.getUTCDate() + daysUntilFriday);
  const daysUntilWednesday = (3 - today.weekday + 7) % 7;
  const physicsWednesday = dateOnly(today.year, today.month, today.day);
  physicsWednesday.setUTCDate(physicsWednesday.getUTCDate() + daysUntilWednesday);

  for (const [code, weekday, startTime, endTime, building, classroom] of slots) {
    const course = courseByCode[code];
    const isEnglishFriday = code === 'ENG101' && weekday === Weekday.FRIDAY;
    const isPhysicsWednesday = code === 'PHY110' && weekday === Weekday.WEDNESDAY;
    await prisma.classSchedule.create({
      data: {
        courseId: course.id,
        groupId: course.groupId,
        classroomId: room(building, classroom),
        weekday,
        startTime,
        endTime,
        status: ClassStatus.SCHEDULED,
        exceptionDate: isEnglishFriday ? englishFriday : isPhysicsWednesday ? physicsWednesday : null,
        exceptionStatus: isEnglishFriday
          ? ClassStatus.CANCELLED
          : isPhysicsWednesday
            ? ClassStatus.ROOM_CHANGED
            : null,
        exceptionNote: isEnglishFriday
          ? 'Cancelled for this session.'
          : isPhysicsWednesday
            ? 'Moved to Building C, room 210.'
            : null,
        overrideClassroomId: isPhysicsWednesday ? room('C', '210') : null,
      },
    });
  }

  for (const student of students) {
    const ownCourses = courses.filter((course) => course.groupCode === student.groupCode);
    for (const course of ownCourses) {
      await prisma.enrollment.create({ data: { studentId: student.id, courseId: course.id } });
    }
  }

  const assessmentPlan: [string, AssessmentType, number][] = [
    ['Quiz', AssessmentType.QUIZ, 10],
    ['Coursework', AssessmentType.ASSIGNMENT, 20],
    ['Midterm', AssessmentType.MIDTERM, 30],
    ['Final exam', AssessmentType.FINAL, 40],
  ];
  const demoScores: Record<string, (number | null)[]> = {
    CS201: [88, 90, 84, null],
    MATH101: [80, 86, 78, null],
    PHY110: [70, 74, 72, null],
    ENG101: [60, 70, 66, null],
    CS210: [85, 88, 80, null],
    CS230: [82, 79, 81, null],
  };

  for (const course of courses) {
    for (const [index, [title, type, weight]] of assessmentPlan.entries()) {
      const assessment = await prisma.assessment.create({
        data: {
          courseId: course.id,
          title,
          type,
          weight,
          maxScore: 100,
          date: type === AssessmentType.FINAL ? new Date('2027-01-15T06:00:00.000Z') : new Date('2026-10-20T06:00:00.000Z'),
        },
      });
      const enrolled = students.filter((student) => student.groupCode === course.groupCode);
      for (const student of enrolled) {
        const preset = student.email === 'demo.student@bmu.example' ? demoScores[course.code]?.[index] : undefined;
        const score =
          preset !== undefined
            ? preset
            : type === AssessmentType.FINAL
              ? null
              : 70 + ((student.studentNo.charCodeAt(student.studentNo.length - 1) + index * 5) % 25);
        await prisma.grade.create({
          data: { studentId: student.id, assessmentId: assessment.id, score },
        });
      }
    }

    await prisma.courseMaterial.createMany({
      data: [
        { courseId: course.id, title: `${course.code} syllabus`, type: MaterialType.DOCUMENT, url: `https://example.com/bmu-demo/${course.code}/syllabus` },
        { courseId: course.id, title: `${course.code} week 1 slides`, type: MaterialType.SLIDE, url: `https://example.com/bmu-demo/${course.code}/week-1` },
      ],
    });
  }

  const demo = students[0];
  const deadlines = [
    ['CS201', 'Programming Assignment', 'Implement the weekly exercises and submit your repository notes.', 0, 23],
    ['PHY110', 'Lab report 3', 'Write up the pendulum experiment.', 3, 18],
    ['MATH101', 'Problem set 4', 'Problems from the linear algebra sheet.', -1, 18],
    ['ENG101', 'Essay draft', '500-word draft on a technology topic.', 6, 18],
    ['CS210', 'Tree worksheet', 'Complete the binary tree exercises.', 4, 18],
  ] as const;
  for (const [code, title, description, dayOffset, hour] of deadlines) {
    const course = courseByCode[code];
    const when = addDays(today.year, today.month, today.day, dayOffset);
    when.setUTCHours(hour - 4, hour === 23 ? 59 : 0, 0, 0);
    const assignment = await prisma.assignment.create({
      data: { courseId: course.id, title, description, deadline: when, maxScore: 100 },
    });
    const enrolled = students.filter((student) => student.groupCode === course.groupCode);
    for (const student of enrolled) {
      const submitted = title !== 'Programming Assignment' && title !== 'Essay draft' && title !== 'Tree worksheet';
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.id,
          status: submitted ? SubmissionStatus.SUBMITTED : SubmissionStatus.NOT_SUBMITTED,
          submittedAt: submitted ? new Date() : null,
          body: submitted ? 'Demo submission text.' : null,
        },
      });
    }
    if (code === 'CS201') {
      await prisma.notification.create({
        data: {
          userId: demo.userId,
          type: NotificationType.ASSIGNMENT,
          title: 'Programming Assignment',
          body: 'Due today at 23:59.',
        },
      });
    }
  }

  const attendanceDates: Date[] = [];
  for (let cursor = 1; attendanceDates.length < 25; cursor += 1) {
    const value = addDays(today.year, today.month, today.day, -cursor);
    const day = value.getUTCDay();
    if (day !== 0 && day !== 6) attendanceDates.push(value);
  }
  const absencePlan: Record<string, number> = { CS201: 2, MATH101: 4, PHY110: 6, ENG101: 8, CS210: 2, CS230: 3 };
  for (const student of students) {
    const ownCourses = courses.filter((course) => course.groupCode === student.groupCode);
    const sessions = student.email === 'demo.student@bmu.example' ? 25 : 8;
    for (const course of ownCourses) {
      const absences = student.email === 'demo.student@bmu.example' ? (absencePlan[course.code] ?? 2) : 1;
      for (let index = 0; index < sessions; index += 1) {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            date: attendanceDates[index],
            status: index < absences ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
          },
        });
      }
    }
  }

  await prisma.announcement.createMany({
    data: [
      {
        title: 'Midterm week',
        body: 'Midterm assessments run from 19 October through 30 October 2026. Check your course page for the exact sitting.',
        audience: 'UNIVERSITY',
        publishedAt: new Date('2026-10-01T06:00:00.000Z'),
      },
      {
        title: 'Library weekend hours',
        body: 'The library reading room is open 10:00–18:00 on Saturdays during the fall semester.',
        audience: 'UNIVERSITY',
        publishedAt: new Date('2026-09-28T06:00:00.000Z'),
      },
      {
        title: 'Programming lab notes',
        body: 'Week 5 slides are available under course materials. Room 304 is unchanged.',
        audience: 'COURSE',
        courseId: courseByCode.CS201.id,
        publishedAt: new Date('2026-10-02T05:00:00.000Z'),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demo.userId,
        type: NotificationType.SCHEDULE,
        title: 'English is cancelled',
        body: 'Your Friday English class is cancelled this week.',
      },
      {
        userId: demo.userId,
        type: NotificationType.ANNOUNCEMENT,
        title: 'Midterm week',
        body: 'See the academic calendar for assessment dates.',
      },
    ],
  });

  await prisma.academicEvent.createMany({
    data: [
      { titleEn: 'Fall registration', titleAz: 'Payız qeydiyyatı', titleRu: 'Осенняя регистрация', type: AcademicEventType.REGISTRATION, startsAt: new Date('2026-09-01T05:00:00.000Z'), endsAt: new Date('2026-09-12T15:00:00.000Z'), descriptionEn: 'Course registration window.' },
      { titleEn: 'Fall semester begins', titleAz: 'Payız semestrinin başlanğıcı', titleRu: 'Начало осеннего семестра', type: AcademicEventType.SEMESTER_START, startsAt: new Date('2026-09-15T05:00:00.000Z'), descriptionEn: 'First day of classes.' },
      { titleEn: 'Midterm assessments', titleAz: 'Aralıq qiymətləndirmə', titleRu: 'Промежуточная аттестация', type: AcademicEventType.ASSESSMENT, startsAt: new Date('2026-10-19T05:00:00.000Z'), endsAt: new Date('2026-10-30T15:00:00.000Z'), descriptionEn: 'Midterm week.' },
      { titleEn: 'Victory Day', titleAz: 'Zəfər Günü', titleRu: 'День Победы', type: AcademicEventType.HOLIDAY, startsAt: new Date('2026-11-08T05:00:00.000Z'), endsAt: new Date('2026-11-08T15:00:00.000Z'), descriptionEn: 'Public holiday. No classes.' },
      { titleEn: 'Flag Day', titleAz: 'Dövlət Bayrağı Günü', titleRu: 'День государственного флага', type: AcademicEventType.HOLIDAY, startsAt: new Date('2026-11-09T05:00:00.000Z'), descriptionEn: 'Public holiday. No classes.' },
      { titleEn: 'Final examinations', titleAz: 'Final imtahanları', titleRu: 'Итоговые экзамены', type: AcademicEventType.EXAM, startsAt: new Date('2027-01-11T05:00:00.000Z'), endsAt: new Date('2027-01-22T15:00:00.000Z'), descriptionEn: 'Fall final exam period.' },
      { titleEn: 'Fall semester ends', titleAz: 'Payız semestrinin sonu', titleRu: 'Конец осеннего семестра', type: AcademicEventType.SEMESTER_END, startsAt: new Date('2027-01-23T05:00:00.000Z'), descriptionEn: 'Semester close.' },
      { titleEn: 'Spring semester begins', titleAz: 'Yaz semestrinin başlanğıcı', titleRu: 'Начало весеннего семестра', type: AcademicEventType.SEMESTER_START, startsAt: new Date('2027-02-09T05:00:00.000Z'), descriptionEn: 'First day of the spring semester.' },
      { titleEn: 'Novruz holiday', titleAz: 'Novruz bayramı', titleRu: 'Праздник Новруз', type: AcademicEventType.HOLIDAY, startsAt: new Date('2027-03-20T05:00:00.000Z'), endsAt: new Date('2027-03-24T15:00:00.000Z'), descriptionEn: 'Novruz break.' },
    ],
  });

  const robotics = await prisma.club.create({
    data: {
      nameEn: 'Robotics Club',
      nameAz: 'Robototexnika klubu',
      nameRu: 'Клуб робототехники',
      descriptionEn: 'Build and program small robots. Weekly lab night in Building C.',
      category: 'Engineering',
    },
  });
  const debate = await prisma.club.create({
    data: {
      nameEn: 'Debate Club',
      nameAz: 'Debat klubu',
      nameRu: 'Дискуссионный клуб',
      descriptionEn: 'Public speaking and parliamentary debate.',
      category: 'Culture',
    },
  });
  await prisma.club.create({
    data: {
      nameEn: 'Chess Club',
      nameAz: 'Şahmat klubu',
      nameRu: 'Шахматный клуб',
      descriptionEn: 'Casual and rated games in the library foyer.',
      category: 'Sport',
    },
  });
  await prisma.club.create({
    data: {
      nameEn: 'Volunteer Club',
      nameAz: 'Könüllü klubu',
      nameRu: 'Волонтерский клуб',
      descriptionEn: 'Campus and city volunteering.',
      category: 'Community',
    },
  });
  await prisma.club.create({
    data: {
      nameEn: 'Engineering Society',
      nameAz: 'Mühəndislik cəmiyyəti',
      nameRu: 'Инженерное общество',
      descriptionEn: 'Talks from alumni and industry guests.',
      category: 'Engineering',
    },
  });

  await prisma.clubMembership.create({ data: { clubId: robotics.id, userId: demo.userId, status: 'ACTIVE' } });
  await prisma.clubMembership.create({ data: { clubId: debate.id, userId: students[1].userId, status: 'ACTIVE' } });

  const hack = await prisma.universityEvent.create({
    data: {
      clubId: robotics.id,
      titleEn: 'Robotics lab night',
      titleAz: 'Robototexnika laboratoriya axşamı',
      titleRu: 'Вечер робототехники',
      descriptionEn: 'Bring a laptop. Components are provided. Open to all students.',
      location: 'Building C · Room 210',
      startsAt: new Date('2026-10-16T12:00:00.000Z'),
      endsAt: new Date('2026-10-16T16:00:00.000Z'),
      capacity: 40,
    },
  });
  await prisma.universityEvent.create({
    data: {
      titleEn: 'Career talk: software engineering',
      titleAz: 'Karyera söhbəti: proqram mühəndisliyi',
      titleRu: 'Карьерная встреча: программная инженерия',
      descriptionEn: 'A guest engineer talks about internships. Demo event, not an official BMU listing.',
      location: 'Building A · Room 105',
      startsAt: new Date('2026-10-22T10:00:00.000Z'),
      endsAt: new Date('2026-10-22T12:00:00.000Z'),
      capacity: 80,
    },
  });
  await prisma.universityEvent.create({
    data: {
      titleEn: 'Autumn chess cup',
      titleAz: 'Payız şahmat kuboku',
      titleRu: 'Осенний шахматный кубок',
      descriptionEn: 'Five-round rapid tournament.',
      location: 'Library foyer',
      startsAt: new Date('2026-11-01T08:00:00.000Z'),
      endsAt: new Date('2026-11-01T14:00:00.000Z'),
      capacity: 32,
    },
  });
  await prisma.eventRegistration.create({ data: { eventId: hack.id, userId: demo.userId, status: 'REGISTERED' } });

  await prisma.libraryBook.createMany({
    data: [
      { title: 'Demo textbook: Programming fundamentals', author: 'BMU Demo Press', isbn: '9780000000001', copies: 12, available: 7 },
      { title: 'Demo textbook: Engineering mathematics', author: 'BMU Demo Press', isbn: '9780000000002', copies: 10, available: 4 },
      { title: 'Demo textbook: University physics', author: 'BMU Demo Press', isbn: '9780000000003', copies: 8, available: 3 },
      { title: 'Demo textbook: Databases in practice', author: 'BMU Demo Press', isbn: '9780000000004', copies: 6, available: 6 },
      { title: 'Demo textbook: Academic writing', author: 'BMU Demo Press', isbn: '9780000000005', copies: 9, available: 5 },
    ],
  });

  await prisma.supportRequest.create({
    data: {
      userId: students[1].userId,
      category: 'ACADEMIC',
      subject: 'Question about midterm seating',
      message: 'Could you confirm which room the midterm uses? This is a demo request.',
      status: 'OPEN',
      messages: {
        create: {
          authorId: students[1].userId,
          body: 'Demo follow-up. This message is fictional.',
          internal: false,
        },
      },
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      label: '2026-2027',
      startsOn: new Date('2026-09-15T00:00:00.000Z'),
      endsOn: new Date('2027-06-30T00:00:00.000Z'),
    },
  });
  const fall = await prisma.semester.create({
    data: {
      academicYearId: academicYear.id,
      term: SemesterTerm.FALL,
      code: '2026-FALL',
      startsOn: new Date('2026-09-15T00:00:00.000Z'),
      endsOn: new Date('2027-01-23T00:00:00.000Z'),
    },
  });

  const catalogRows = await Promise.all(
    [
      courseByCode.CS201,
      courseByCode.PHY110,
    ].map((course) =>
      prisma.courseCatalog.create({
        data: {
          code: course.code,
          titleEn: course.titleEn,
          titleAz: course.titleAz,
          titleRu: course.titleRu,
          credits: course.credits,
          descriptionEn: 'Fictional catalog row for the demo dataset.',
        },
      }),
    ),
  );
  await prisma.courseOffering.create({
    data: {
      semesterId: fall.id,
      catalogId: catalogRows[0].id,
      sectionCode: 'A',
      teacherId: teacher.leyla,
      groupId: groupId['CE-2201'],
      legacyCourseId: courseByCode.CS201.id,
    },
  });
  await prisma.courseOffering.create({
    data: {
      semesterId: fall.id,
      catalogId: catalogRows[0].id,
      sectionCode: 'B',
      teacherId: teacher.tural,
      groupId: groupId['CE-2202'],
    },
  });
  await prisma.courseOffering.create({
    data: {
      semesterId: fall.id,
      catalogId: catalogRows[1].id,
      sectionCode: 'A',
      teacherId: teacher.kamran,
      groupId: groupId['CE-2201'],
      legacyCourseId: courseByCode.PHY110.id,
    },
  });

  await prisma.attendancePolicy.create({
    data: {
      courseId: courseByCode.PHY110.id,
      minPercent: 70,
      lateCountsAs: 1,
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: 'ai.assistant', enabled: true, audience: 'student' },
      { key: 'dining.prices.demo', enabled: true, audience: 'all' },
      { key: 'official.sync', enabled: false, audience: 'none' },
    ],
  });

  await prisma.diningVenue.create({
    data: {
      nameEn: 'Demo cafeteria',
      nameAz: 'Demo yeməkxana',
      nameRu: 'Демо-столовая',
      location: 'Cafeteria building (demo directory)',
      demo: true,
      days: {
        create: {
          date: new Date('2026-10-06T00:00:00.000Z'),
          items: {
            create: [
              {
                nameEn: 'Demo lentil soup',
                nameAz: 'Demo mərci şorbası',
                nameRu: 'Демо-чечевичный суп',
                priceMinor: 150,
                currency: 'AZN',
                demo: true,
              },
              {
                nameEn: 'Demo rice plate',
                nameAz: 'Demo plov',
                nameRu: 'Демо-плов',
                priceMinor: 350,
                currency: 'AZN',
                demo: true,
              },
            ],
          },
        },
      },
    },
  });

  await prisma.careerOpportunity.create({
    data: {
      titleEn: 'Demo internship: campus software club',
      titleAz: 'Demo təcrübə: kampus proqram klubu',
      titleRu: 'Демо-стажировка: кампусный кружок',
      organization: 'Fictional Demo Labs',
      descriptionEn: 'Invented listing for the demo app. Not an official BMU vacancy.',
      deadline: new Date('2026-12-01T00:00:00.000Z'),
      demo: true,
    },
  });
  await prisma.careerEvent.create({
    data: {
      titleEn: 'Demo career conversation',
      titleAz: 'Demo karyera söhbəti',
      titleRu: 'Демо-карьерная встреча',
      location: 'Building A · Room 105 (demo)',
      startsAt: new Date('2026-10-22T10:00:00.000Z'),
      endsAt: new Date('2026-10-22T11:00:00.000Z'),
      descriptionEn: 'Fictional career-center event. Not published by BMU.',
      demo: true,
    },
  });
  await prisma.careerResource.create({
    data: {
      titleEn: 'Demo CV checklist',
      titleAz: 'Demo CV siyahısı',
      titleRu: 'Демо-список для резюме',
      url: 'https://example.com/bmu-demo/cv-checklist',
      notes: 'Fictional handout.',
      demo: true,
    },
  });

  await prisma.studentServiceInfo.createMany({
    data: [
      {
        kind: StudentServiceKind.MEDICAL,
        nameEn: 'Demo campus medical room',
        nameAz: 'Demo tibb otağı',
        nameRu: 'Демо-медпункт',
        hours: 'Mon–Fri 09:00–17:00 (demo)',
        location: 'Administration building, directory only',
        notes: 'Directory listing only. No medical records are stored.',
      },
      {
        kind: StudentServiceKind.PSYCHOLOGICAL,
        nameEn: 'Demo counseling hours',
        nameAz: 'Demo psixoloji məsləhət saatları',
        nameRu: 'Демо-часы психологической поддержки',
        hours: 'Tue and Thu 11:00–15:00 (demo)',
        location: 'Administration building, directory only',
        notes: 'Directory listing only. No counseling notes are stored.',
      },
      {
        kind: StudentServiceKind.CAREER,
        nameEn: 'Demo career desk',
        nameAz: 'Demo karyera masası',
        nameRu: 'Демо-карьера',
        hours: 'Mon–Fri 10:00–16:00 (demo)',
        location: 'Building A lobby (demo)',
        notes: 'Fictional directory entry.',
      },
      {
        kind: StudentServiceKind.SPORTS,
        nameEn: 'Demo sports hall desk',
        nameAz: 'Demo idman zalı',
        nameRu: 'Демо-спортзал',
        hours: 'Mon–Sat 08:00–20:00 (demo)',
        location: 'Gym building (demo)',
        notes: 'Fictional directory entry.',
      },
    ],
  });

  const programmingBook = await prisma.libraryBook.findFirst({ where: { isbn: '9780000000001' } });
  if (programmingBook) {
    await prisma.libraryLoan.create({
      data: {
        studentId: demo.id,
        bookId: programmingBook.id,
        status: LibraryLoanStatus.ACTIVE,
        dueAt: new Date('2026-11-01T00:00:00.000Z'),
      },
    });
  }

  await prisma.dormApplication.create({
    data: {
      studentId: demo.id,
      status: DormApplicationStatus.DRAFT,
      note: 'Fictional demo application. Not sent to a university office.',
    },
  });

  await prisma.syncLog.create({
    data: {
      source: 'official-bmu',
      status: SyncStatus.FAILED,
      message: 'Demo row. Official BMU sync is not configured and was not attempted against a university system.',
      startedAt: new Date('2026-10-01T00:00:00.000Z'),
      finishedAt: new Date('2026-10-01T00:00:01.000Z'),
    },
  });

  console.log(`Admin user id ${admin.id}`);
  console.log('Seeded BMU demo data.');
  console.log('Accounts use password DemoPass123!');
  console.log('demo.student@bmu.example');
  console.log('demo.teacher@bmu.example');
  console.log('demo.admin@bmu.example');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
