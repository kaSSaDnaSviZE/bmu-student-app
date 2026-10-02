import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [BmuModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
