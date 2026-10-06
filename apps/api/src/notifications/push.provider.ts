import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

/** FCM HTTP v1 shaped payload. This build never posts it to Google. */
export interface FcmMessage {
  token: string;
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}

export interface PushSendResult {
  delivered: boolean;
  reason: string;
}

export interface PushProvider {
  send(message: FcmMessage): Promise<PushSendResult>;
}

export class NoopPushProvider implements PushProvider {
  async send(): Promise<PushSendResult> {
    return { delivered: false, reason: 'push-not-configured' };
  }
}

export class FcmPushProvider implements PushProvider {
  constructor(private readonly config: { serverKey?: string; projectId?: string }) {}

  async send(message: FcmMessage): Promise<PushSendResult> {
    if (!this.config.serverKey || !this.config.projectId) {
      return { delivered: false, reason: 'fcm-not-configured' };
    }
    if (!message.token) return { delivered: false, reason: 'missing-token' };
    return { delivered: false, reason: 'fcm-client-not-wired' };
  }
}

export function createPushProvider(env: NodeJS.ProcessEnv = process.env): PushProvider {
  if (env.FCM_SERVER_KEY && env.FCM_PROJECT_ID) {
    return new FcmPushProvider({ serverKey: env.FCM_SERVER_KEY, projectId: env.FCM_PROJECT_ID });
  }
  return new NoopPushProvider();
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');

@Injectable()
export class DeviceTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async register(userId: string, token: string, platform: DevicePlatform) {
    if (!token || token.length > 4096) {
      throw new Error('Invalid device token');
    }
    const row = await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, revokedAt: null },
      create: { userId, token, platform },
    });
    await this.audit.write({
      actorId: userId,
      action: 'device_token.register',
      resource: 'DeviceToken',
      resourceId: row.id,
      metadata: { platform },
    });
    return { id: row.id, platform: row.platform, revokedAt: row.revokedAt };
  }

  async revoke(userId: string, token: string) {
    const existing = await this.prisma.deviceToken.findUnique({ where: { token } });
    if (!existing || existing.userId !== userId) {
      return { revoked: false };
    }
    await this.prisma.deviceToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
    await this.audit.write({
      actorId: userId,
      action: 'device_token.revoke',
      resource: 'DeviceToken',
      resourceId: existing.id,
      metadata: { platform: existing.platform },
    });
    return { revoked: true };
  }
}
