import { Module } from '@nestjs/common';
import { DiningController } from './dining.controller';

@Module({ controllers: [DiningController] })
export class DiningModule {}
