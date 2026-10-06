import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SECRET_KEY = /password|secret|token|authorization|cookie|api[_-]?key|credential/i;

export function redactMetadata(metadata: unknown): Prisma.InputJsonValue | undefined {
  if (metadata == null) return undefined;
  return redactValue(metadata) as Prisma.InputJsonValue;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : redactValue(child);
    }
    return out;
  }
  return value;
}

export interface AuditWriteInput {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(entry: AuditWriteInput) {
    const metadata = redactMetadata(entry.metadata);
    return this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId || null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        ...(metadata !== undefined ? { metadata } : {}),
        ip: entry.ip || null,
        userAgent: entry.userAgent || null,
      },
    });
  }
}
