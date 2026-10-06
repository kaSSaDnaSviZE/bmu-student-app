import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PermissionsGuard, RequirePermissions } from './permissions.guard';
import { Permissions, roleHasPermission } from './permissions';

describe('roleHasPermission', () => {
  it('gives students only their own read and submit permissions', () => {
    expect(roleHasPermission(Role.STUDENT, Permissions.ScheduleReadOwn)).toBe(true);
    expect(roleHasPermission(Role.STUDENT, Permissions.GradesReadOwn)).toBe(true);
    expect(roleHasPermission(Role.STUDENT, Permissions.LibraryLoansReadOwn)).toBe(true);
    expect(roleHasPermission(Role.STUDENT, Permissions.GradesManage)).toBe(false);
    expect(roleHasPermission(Role.STUDENT, Permissions.AttendanceManage)).toBe(false);
    expect(roleHasPermission(Role.STUDENT, Permissions.UsersManage)).toBe(false);
    expect(roleHasPermission(Role.STUDENT, 'not.a.permission')).toBe(false);
  });

  it('lets teachers manage grades but not staff administration', () => {
    expect(roleHasPermission(Role.TEACHER, Permissions.GradesManage)).toBe(true);
    expect(roleHasPermission(Role.TEACHER, Permissions.AssignmentsManage)).toBe(true);
    expect(roleHasPermission(Role.TEACHER, Permissions.UsersManage)).toBe(false);
    expect(roleHasPermission(Role.TEACHER, Permissions.AuditRead)).toBe(false);
    expect(roleHasPermission(Role.TEACHER, Permissions.GradesReadOwn)).toBe(false);
  });

  it('gives admins staff permissions including teacher academic tools', () => {
    expect(roleHasPermission(Role.ADMIN, Permissions.GradesManage)).toBe(true);
    expect(roleHasPermission(Role.ADMIN, Permissions.UsersManage)).toBe(true);
    expect(roleHasPermission(Role.ADMIN, Permissions.AuditRead)).toBe(true);
    expect(roleHasPermission(Role.ADMIN, Permissions.FlagsManage)).toBe(true);
    expect(roleHasPermission(Role.ADMIN, Permissions.LibraryManage)).toBe(true);
    expect(roleHasPermission(Role.ADMIN, Permissions.DormitoryManage)).toBe(true);
  });
});

class GuardedController {
  @RequirePermissions(Permissions.GradesManage)
  manage() {
    return true;
  }

  open() {
    return true;
  }
}

function contextFor(handlerName: 'manage' | 'open', user?: object): ExecutionContext {
  const handler = GuardedController.prototype[handlerName];
  return {
    getHandler: () => handler,
    getClass: () => GuardedController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows a teacher through grades.manage and skips undecorated routes', () => {
    expect(
      guard.canActivate(contextFor('manage', { id: 't', role: Role.TEACHER, email: 't@bmu.example', studentId: null, teacherId: 't1' })),
    ).toBe(true);
    expect(guard.canActivate(contextFor('open', undefined))).toBe(true);
  });

  it('rejects a student from grades.manage', () => {
    expect(() =>
      guard.canActivate(
        contextFor('manage', {
          id: 's',
          role: Role.STUDENT,
          email: 's@bmu.example',
          studentId: 's1',
          teacherId: null,
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
