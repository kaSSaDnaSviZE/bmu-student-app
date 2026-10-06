import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { assertDataProviderPolicy } from '../config/provider-policy';
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
      ) => {
        const mode = assertDataProviderPolicy({
          NODE_ENV: config.get<string>('NODE_ENV') ?? process.env.NODE_ENV,
          BMU_DATA_PROVIDER: config.get<string>('BMU_DATA_PROVIDER') ?? process.env.BMU_DATA_PROVIDER,
        });
        return mode === 'official' ? official : mock;
      },
    },
  ],
  exports: [BMU_DATA_PROVIDER],
})
export class BmuModule {}
