import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { CampusController } from './campus.controller';

@Module({ imports: [BmuModule], controllers: [CampusController] })
export class CampusModule {}
