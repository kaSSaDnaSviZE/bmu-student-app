import { Controller, Delete, Get, Inject, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.data.getEvents(user.id);
  }

  @Get(':id')
  async one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const event = await this.data.getEvent(user.id, id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  @Post(':id/register')
  register(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.data.registerForEvent(user.id, id);
  }

  @Delete(':id/register')
  unregister(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.data.unregisterFromEvent(user.id, id);
  }
}
