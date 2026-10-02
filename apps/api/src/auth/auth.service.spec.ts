import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const password = 'DemoPass123!';
  let hash: string;
  const tokens: {
    id: string;
    tokenHash: string;
    userId: string;
    revokedAt: Date | null;
    expiresAt: Date;
    replacedById?: string;
  }[] = [];

  const user = {
    id: 'user-student',
    email: 'demo.student@bmu.example',
    role: Role.STUDENT,
    firstName: 'Alex',
    lastName: 'Demo',
    isActive: true,
    passwordHash: '',
    student: { id: 'student-1' },
    teacher: null,
  };

  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email: string } }) => {
        if (where.email === user.email) return { ...user, passwordHash: hash };
        return null;
      }),
    },
    refreshToken: {
      create: jest.fn(async ({ data }: { data: { userId: string; tokenHash: string; expiresAt: Date } }) => {
        const row = { id: `rt-${tokens.length + 1}`, revokedAt: null, ...data };
        tokens.push(row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: { where: { tokenHash: string } }) => {
        const row = tokens.find((item) => item.tokenHash === where.tokenHash);
        if (!row) return null;
        return { ...row, user: { ...user, passwordHash: hash } };
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { revokedAt?: Date; replacedById?: string } }) => {
        const row = tokens.find((item) => item.id === where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: { userId: string; revokedAt: null }; data: { revokedAt: Date } }) => {
        let count = 0;
        for (const row of tokens) {
          if (row.userId === where.userId && row.revokedAt == null) {
            row.revokedAt = data.revokedAt;
            count += 1;
          }
        }
        return { count };
      }),
    },
  };

  let service: AuthService;

  beforeAll(async () => {
    hash = await bcrypt.hash(password, 4);
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret-test-secret-test-secret', signOptions: { expiresIn: 900 } })],
      providers: [AuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  beforeEach(() => {
    tokens.length = 0;
  });

  it('rejects an unknown user and a wrong password', async () => {
    await expect(service.login('nobody@bmu.example', password)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login(user.email, 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues an access token scoped to the student and rotates refresh tokens', async () => {
    const first = await service.login(user.email, password);
    expect(first.user.studentId).toBe('student-1');
    expect(first.user).not.toHaveProperty('passwordHash');
    const payload = JSON.parse(Buffer.from(first.accessToken.split('.')[1], 'base64url').toString());
    expect(payload.sub).toBe(user.id);
    expect(payload.studentId).toBe('student-1');
    expect(payload.role).toBe(Role.STUDENT);

    const second = await service.refresh(first.refreshToken);
    expect(second.accessToken).not.toBe(first.accessToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(tokens[0].revokedAt).toBeInstanceOf(Date);
    expect(tokens[0].replacedById).toBe(tokens[1].id);

    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokens[1].revokedAt).toBeInstanceOf(Date);
  });

  it('revokes the presented refresh token on logout', async () => {
    const session = await service.login(user.email, password);
    await service.logout(user.id, session.refreshToken);
    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
