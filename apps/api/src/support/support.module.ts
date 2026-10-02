import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { SupportController } from './support.controller';

@Module({ imports: [BmuModule], controllers: [SupportController] })
export class SupportModule {}
