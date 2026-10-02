import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Course detail for an enrolled student' })
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courses.getOne(user, id);
  }

  @Get(':id/materials')
  materials(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courses.materials(user, id);
  }

  @Get(':id/assignments')
  assignments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courses.assignments(user, id);
  }
}
