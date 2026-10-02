import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BmuModule } from './bmu/bmu.module';
import { CalendarModule } from './calendar/calendar.module';
import { CampusModule } from './campus/campus.module';
import { ClubsModule } from './clubs/clubs.module';
import { CoursesModule } from './courses/courses.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health.controller';
import { MeModule } from './me/me.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
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
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
