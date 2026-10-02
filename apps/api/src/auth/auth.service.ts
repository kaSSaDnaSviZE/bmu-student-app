import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthUser, JwtPayload } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';

export interface AccountRecord {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  passwordHash: string;
  isActive: boolean;
  student: { id: string } | null;
  teacher: { id: string } | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { student: true, teacher: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.issueTokens(user);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.accessTtl(),
      user: this.toPublic(user),
    };
  }

  async refresh(rawToken: string) {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: { include: { student: true, teacher: true } } },
    });
    if (!existing) throw new UnauthorizedException('Invalid refresh token');
    if (existing.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const tokens = await this.issueTokens(existing.user);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: tokens.id },
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.accessTtl(),
      user: this.toPublic(existing.user),
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash: this.hash(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  toAuthUser(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId,
      teacherId: payload.teacherId,
    };
  }

  private async issueTokens(user: AccountRecord) {
    const payload: JwtPayload & { jti: string } = {
      sub: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student?.id ?? null,
      teacherId: user.teacher?.id ?? null,
      jti: randomBytes(16).toString('hex'),
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: this.accessTtl() });
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 14);
    const record = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + days * 86400000),
      },
    });
    return { accessToken, refreshToken, id: record.id };
  }

  private accessTtl(): number {
    return Number(process.env.JWT_ACCESS_TTL ?? 900);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublic(user: AccountRecord) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.student?.id ?? null,
      teacherId: user.teacher?.id ?? null,
    };
  }
}
