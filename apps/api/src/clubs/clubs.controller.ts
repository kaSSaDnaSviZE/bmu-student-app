import { Controller, Get, Inject, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';

@ApiTags('clubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clubs')
export class ClubsController {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.data.getClubs(user.id);
  }

  @Get(':id')
  async one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const club = await this.data.getClub(user.id, id);
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  @Post(':id/join')
  join(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.data.joinClub(user.id, id);
  }

  @Post(':id/leave')
  leave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.data.leaveClub(user.id, id);
  }
}
