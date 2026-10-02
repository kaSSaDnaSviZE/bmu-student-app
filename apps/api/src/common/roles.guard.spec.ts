import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class StudentController {
  @Roles(Role.STUDENT)
  grades() {
    return true;
  }

  open() {
    return true;
  }
}

function contextFor(handlerName: 'grades' | 'open', user?: object): ExecutionContext {
  const handler = StudentController.prototype[handlerName];
  return {
    getHandler: () => handler,
    getClass: () => StudentController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows a student into a student route', () => {
    expect(
      guard.canActivate(
        contextFor('grades', {
          id: 'u1',
          role: Role.STUDENT,
          email: 'demo.student@bmu.example',
          studentId: 's1',
          teacherId: null,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a teacher from a student route', () => {
    expect(() =>
      guard.canActivate(
        contextFor('grades', {
          id: 'u2',
          role: Role.TEACHER,
          email: 'demo.teacher@bmu.example',
          studentId: null,
          teacherId: 't1',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects a student token that has no student profile', () => {
    expect(() =>
      guard.canActivate(
        contextFor('grades', {
          id: 'u3',
          role: Role.STUDENT,
          email: 'x@bmu.example',
          studentId: null,
          teacherId: null,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows routes without a role metadata', () => {
    expect(guard.canActivate(contextFor('open', undefined))).toBe(true);
  });
});
