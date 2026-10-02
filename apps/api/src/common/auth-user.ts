import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  studentId: string | null;
  teacherId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  studentId: string | null;
  teacherId: string | null;
}
