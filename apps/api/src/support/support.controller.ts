import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/auth-user';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';
import { CreateSupportRequestDto } from './dto';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support-requests')
export class SupportController {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.data.listSupportRequests(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupportRequestDto) {
    return this.data.createSupportRequest(user.id, dto);
  }
}
