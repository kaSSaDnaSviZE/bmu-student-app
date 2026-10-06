import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('student-services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('student-services')
export class StudentServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(Permissions.ServicesRead)
  list() {
    return this.prisma.studentServiceInfo.findMany({
      orderBy: { kind: 'asc' },
      select: {
        id: true,
        kind: true,
        nameEn: true,
        nameAz: true,
        nameRu: true,
        hours: true,
        location: true,
        phone: true,
        notes: true,
      },
    });
  }
}
