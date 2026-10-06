import { Module } from '@nestjs/common';
import { JobRunner } from './job-runner';

@Module({
  providers: [JobRunner],
  exports: [JobRunner],
})
export class JobsModule {}
