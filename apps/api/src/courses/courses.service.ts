import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { requireStudent } from '../common/student-access';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';

@Injectable()
export class CoursesService {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  async getOne(user: AuthUser, courseId: string) {
    const course = await this.data.getCourseForStudent(requireStudent(user), courseId);
    if (!course) throw new ForbiddenException('You are not enrolled in this course');
    return course;
  }

  async materials(user: AuthUser, courseId: string) {
    const rows = await this.data.getCourseMaterials(requireStudent(user), courseId);
    if (!rows) throw new ForbiddenException('You are not enrolled in this course');
    return rows;
  }

  async assignments(user: AuthUser, courseId: string) {
    const rows = await this.data.getCourseAssignments(requireStudent(user), courseId);
    if (!rows) throw new ForbiddenException('You are not enrolled in this course');
    return rows;
  }
}
