import { Module } from '@nestjs/common';
import { StudentServicesController } from './student-services.controller';

@Module({ controllers: [StudentServicesController] })
export class ServicesModule {}
