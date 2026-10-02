import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CalendarController {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  @Get('calendar')
  calendar() {
    return this.data.getAcademicCalendar();
  }

  @Get('announcements')
  @Roles(Role.STUDENT)
  announcements(@CurrentUser() user: AuthUser) {
    return this.data.getAnnouncements(user.studentId as string);
  }
}
