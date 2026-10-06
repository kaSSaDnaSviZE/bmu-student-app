import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('career')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('career')
export class CareerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('opportunities')
  @RequirePermissions(Permissions.CareerRead)
  opportunities() {
    return this.prisma.careerOpportunity.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get('events')
  @RequirePermissions(Permissions.CareerRead)
  events() {
    return this.prisma.careerEvent.findMany({ orderBy: { startsAt: 'asc' } });
  }

  @Get('resources')
  @RequirePermissions(Permissions.CareerRead)
  resources() {
    return this.prisma.careerResource.findMany({ orderBy: { titleEn: 'asc' } });
  }
}
