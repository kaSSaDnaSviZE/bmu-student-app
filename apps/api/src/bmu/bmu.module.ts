import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BMU_DATA_PROVIDER } from './bmu-data.types';
import { MockBMUDataProvider } from './mock-bmu-data.provider';
import { OfficialBMUDataProvider } from './official-bmu-data.provider';

@Module({
  providers: [
    MockBMUDataProvider,
    OfficialBMUDataProvider,
    {
      provide: BMU_DATA_PROVIDER,
      inject: [MockBMUDataProvider, OfficialBMUDataProvider, ConfigService],
      useFactory: (
        mock: MockBMUDataProvider,
        official: OfficialBMUDataProvider,
        config: ConfigService,
      ) => (config.get<string>('BMU_DATA_PROVIDER') === 'official' ? official : mock),
    },
  ],
  exports: [BMU_DATA_PROVIDER],
})
export class BmuModule {}
