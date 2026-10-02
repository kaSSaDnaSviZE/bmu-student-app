import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BMUDataProvider } from '../bmu/bmu-data.types';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  const data = {
    getCourseForStudent: jest.fn(async (studentId: string, courseId: string) => {
      if (studentId === 'student-1' && courseId === 'course-1') return { id: courseId, title: 'Programming' };
      return null;
    }),
    getCourseMaterials: jest.fn(async (studentId: string, courseId: string) => {
      if (studentId === 'student-1' && courseId === 'course-1') return [{ title: 'Slides' }];
      return null;
    }),
    getCourseAssignments: jest.fn(async () => null),
  } as unknown as BMUDataProvider;

  const service = new CoursesService(data);
  const student = {
    id: 'u',
    email: 'demo.student@bmu.example',
    role: Role.STUDENT,
    studentId: 'student-1',
    teacherId: null,
  };

  it('returns an enrolled course and its materials', async () => {
    await expect(service.getOne(student, 'course-1')).resolves.toMatchObject({ title: 'Programming' });
    await expect(service.materials(student, 'course-1')).resolves.toHaveLength(1);
    expect(data.getCourseForStudent).toHaveBeenCalledWith('student-1', 'course-1');
  });

  it('hides courses the student is not enrolled in', async () => {
    await expect(service.getOne(student, 'someone-elses-course')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.assignments(student, 'course-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
