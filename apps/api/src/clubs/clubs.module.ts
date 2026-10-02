import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { ClubsController } from './clubs.controller';

@Module({ imports: [BmuModule], controllers: [ClubsController] })
export class ClubsModule {}
