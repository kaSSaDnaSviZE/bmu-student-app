import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BMUDataProvider } from '../bmu/bmu-data.types';
import { MeService } from './me.service';

describe('MeService authorization', () => {
  const data = {
    getStudentSchedule: jest.fn(async (studentId: string) => [{ studentId }]),
    getStudentGrades: jest.fn(async (_studentId: string) => [
      {
        courseId: 'course-1',
        courseTitle: 'Programming',
        assessments: [
          { weight: 60, score: 80, maxScore: 100, isFinal: false },
          { weight: 40, score: null, maxScore: 100, isFinal: true },
        ],
      },
    ]),
    getStudentAttendance: jest.fn(async (studentId: string, courseQuery?: string) => [
      { studentId, courseQuery, courseTitle: 'Physics', percent: 76 },
    ]),
    getStudentCourses: jest.fn(async (studentId: string) => [{ studentId }]),
    getStudentAssignments: jest.fn(async (studentId: string) => [{ studentId }]),
  } as unknown as BMUDataProvider;

  const service = new MeService(data);
  const student = {
    id: 'user-1',
    email: 'demo.student@bmu.example',
    role: Role.STUDENT,
    studentId: 'student-1',
    teacherId: null,
  };
  const teacher = {
    id: 'user-2',
    email: 'demo.teacher@bmu.example',
    role: Role.TEACHER,
    studentId: null,
    teacherId: 'teacher-1',
  };

  it('loads schedule, grades, attendance and courses only for the token student', async () => {
    await service.schedule(student, 'week');
    await service.grades(student);
    await service.attendance(student, 'physics');
    await service.courses(student);
    await service.assignments(student);
    expect(data.getStudentSchedule).toHaveBeenCalledWith('student-1', 'week', expect.any(Date));
    expect(data.getStudentGrades).toHaveBeenCalledWith('student-1');
    expect(data.getStudentAttendance).toHaveBeenCalledWith('student-1', 'physics');
    expect(data.getStudentCourses).toHaveBeenCalledWith('student-1');
    expect(data.getStudentAssignments).toHaveBeenCalledWith('student-1');
  });

  it('calculates a final target from the student grade record', async () => {
    const result = await service.calculate(student, 'course-1', 85);
    expect(result.courseTitle).toBe('Programming');
    expect(result.requiredPercent).toBe(92.5);
  });

  it('does not let a teacher read a student schedule, grades or attendance', async () => {
    await expect(service.schedule(teacher, 'today')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.grades(teacher)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.attendance(teacher)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
