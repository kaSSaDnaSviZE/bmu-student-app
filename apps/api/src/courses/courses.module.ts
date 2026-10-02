import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [BmuModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
