import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { CalendarController } from './calendar.controller';

@Module({ imports: [BmuModule], controllers: [CalendarController] })
export class CalendarModule {}
