import { Controller, Get, Inject, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BMU_DATA_PROVIDER, BMUDataProvider } from '../bmu/bmu-data.types';

@ApiTags('campus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campus')
export class CampusController {
  constructor(@Inject(BMU_DATA_PROVIDER) private readonly data: BMUDataProvider) {}

  @Get('buildings')
  @ApiOperation({ summary: 'Campus directory. Coordinates are for a future map provider, not live GPS.' })
  buildings() {
    return this.data.getBuildings();
  }

  @Get('classrooms/:id')
  async classroom(@Param('id') id: string) {
    const room = await this.data.getClassroom(id);
    if (!room) throw new NotFoundException('Classroom not found');
    return room;
  }

  @Get('library')
  library() {
    return this.data.getLibrary();
  }

  @Get('dormitories')
  dormitories() {
    return this.data.getDormitories();
  }
}
