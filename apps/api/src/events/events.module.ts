import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { EventsController } from './events.controller';

@Module({ imports: [BmuModule], controllers: [EventsController] })
export class EventsModule {}
