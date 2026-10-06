import { Module } from '@nestjs/common';
import { DormitoryController } from './dormitory.controller';

@Module({ controllers: [DormitoryController] })
export class DormitoryModule {}
