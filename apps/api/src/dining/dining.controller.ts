import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('dining')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dining')
export class DiningController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('menus')
  @RequirePermissions(Permissions.DiningRead)
  async menus() {
    const venues = await this.prisma.diningVenue.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        days: {
          orderBy: { date: 'asc' },
          include: { items: { orderBy: { nameEn: 'asc' } } },
        },
      },
    });
    return {
      demo: true,
      priceNote: 'Menu prices are demo figures in minor units (currency AZN by default) and are not official BMU charges.',
      venues: venues.map((venue) => ({
        id: venue.id,
        nameEn: venue.nameEn,
        nameAz: venue.nameAz,
        nameRu: venue.nameRu,
        location: venue.location,
        demo: true,
        days: venue.days.map((day) => ({
          id: day.id,
          date: day.date,
          items: day.items.map((item) => ({
            id: item.id,
            nameEn: item.nameEn,
            nameAz: item.nameAz,
            nameRu: item.nameRu,
            priceMinor: item.priceMinor,
            currency: item.currency,
            demo: true,
            priceLabel:
              item.priceMinor == null ? null : `${(item.priceMinor / 100).toFixed(2)} ${item.currency} (demo)`,
          })),
        })),
      })),
    };
  }
}
