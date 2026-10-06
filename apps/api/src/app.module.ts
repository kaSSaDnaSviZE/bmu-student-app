import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BmuModule } from './bmu/bmu.module';
import { CalendarModule } from './calendar/calendar.module';
import { CampusModule } from './campus/campus.module';
import { CareerModule } from './career/career.module';
import { ClubsModule } from './clubs/clubs.module';
import { CoursesModule } from './courses/courses.module';
import { DiningModule } from './dining/dining.module';
import { DormitoryModule } from './dormitory/dormitory.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health.controller';
import { JobsModule } from './jobs/jobs.module';
import { LibraryModule } from './library/library.module';
import { MeModule } from './me/me.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { StorageModule } from './storage/storage.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuditModule,
    StorageModule,
    JobsModule,
    BmuModule,
    AuthModule,
    MeModule,
    CoursesModule,
    CampusModule,
    EventsModule,
    ClubsModule,
    CalendarModule,
    SupportModule,
    AiModule,
    NotificationsModule,
    LibraryModule,
    DormitoryModule,
    CareerModule,
    DiningModule,
    ServicesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
