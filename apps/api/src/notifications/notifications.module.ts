import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DeviceTokenController } from './device-token.controller';
import { DeviceTokenService, PUSH_PROVIDER, createPushProvider } from './push.provider';

@Module({
  imports: [AuditModule],
  controllers: [DeviceTokenController],
  providers: [
    DeviceTokenService,
    { provide: PUSH_PROVIDER, useFactory: () => createPushProvider(process.env) },
  ],
  exports: [DeviceTokenService, PUSH_PROVIDER],
})
export class NotificationsModule {}
