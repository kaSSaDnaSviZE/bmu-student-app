import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DormApplicationStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { requireStudent } from '../common/student-access';
import { PrismaService } from '../prisma/prisma.service';

class CreateDormApplicationDto {
  @IsOptional()
  @IsIn([DormApplicationStatus.DRAFT, DormApplicationStatus.SUBMITTED])
  status?: DormApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

@ApiTags('dormitory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dormitory')
export class DormitoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(Permissions.DormitoryRead)
  list() {
    return this.prisma.dormitory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        gender: true,
        building: { select: { code: true, nameEn: true, nameAz: true, nameRu: true } },
        rooms: { select: { id: true, number: true, capacity: true, occupied: true } },
      },
    });
  }

  @Get('applications')
  @RequirePermissions(Permissions.DormitoryApplicationReadOwn)
  applications(@CurrentUser() user: AuthUser) {
    const studentId = requireStudent(user);
    return this.prisma.dormApplication.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, note: true, createdAt: true, updatedAt: true },
    });
  }

  @Post('applications')
  @RequirePermissions(Permissions.DormitoryApplicationWriteOwn)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDormApplicationDto) {
    const studentId = requireStudent(user);
    return this.prisma.dormApplication.create({
      data: {
        studentId,
        status: dto.status ?? DormApplicationStatus.DRAFT,
        note: dto.note,
      },
      select: { id: true, status: true, note: true, createdAt: true },
    });
  }
}
