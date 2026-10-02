import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from './auth-user';

export function requireStudent(user: AuthUser): string {
  if (user.role !== Role.STUDENT || !user.studentId) {
    throw new ForbiddenException('This resource is limited to the authenticated student');
  }
  return user.studentId;
}
