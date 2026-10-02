import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { GradeTargetDto, ScheduleQueryDto, SubmitAssignmentDto } from './dto';
import { MeService } from './me.service';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  @ApiOperation({ summary: 'Current user profile. Students receive their academic profile.' })
  async meProfile(@CurrentUser() user: AuthUser) {
    if (user.role === Role.STUDENT && user.studentId) {
      const profile = await this.me.profile(user);
      return { ...user, profile };
    }
    return user;
  }

  @Get('dashboard')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Home dashboard for the authenticated student' })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.me.dashboard(user);
  }

  @Get('schedule')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Schedule for today, tomorrow, the week, or the next class' })
  schedule(@CurrentUser() user: AuthUser, @Query() query: ScheduleQueryDto) {
    return this.me.schedule(user, this.me.assertScope(query.scope));
  }

  @Get('courses')
  @Roles(Role.STUDENT)
  courses(@CurrentUser() user: AuthUser) {
    return this.me.courses(user);
  }

  @Get('grades')
  @Roles(Role.STUDENT)
  grades(@CurrentUser() user: AuthUser) {
    return this.me.grades(user);
  }

  @Post('grades/calculate')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'What score is needed on the final to reach a target' })
  calculate(@CurrentUser() user: AuthUser, @Body() dto: GradeTargetDto) {
    return this.me.calculate(user, dto.courseId, dto.target);
  }

  @Get('attendance')
  @Roles(Role.STUDENT)
  attendance(@CurrentUser() user: AuthUser) {
    return this.me.attendance(user);
  }

  @Get('assignments')
  @Roles(Role.STUDENT)
  assignments(@CurrentUser() user: AuthUser) {
    return this.me.assignments(user);
  }

  @Post('assignments/:id/submit')
  @Roles(Role.STUDENT)
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitAssignmentDto) {
    return this.me.submitAssignment(user, id, dto.body);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Notifications for the authenticated user only' })
  notifications(@CurrentUser() user: AuthUser) {
    return this.me.notifications(user);
  }

  @Patch('notifications/:id/read')
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.me.markRead(user, id);
  }

  @Get('student-id')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Demo digital student ID. Not an official BMU credential.' })
  studentId(@CurrentUser() user: AuthUser) {
    return this.me.studentId(user);
  }
}
