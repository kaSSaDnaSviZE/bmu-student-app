import { Module } from '@nestjs/common';
import { BmuModule } from '../bmu/bmu.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [BmuModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
