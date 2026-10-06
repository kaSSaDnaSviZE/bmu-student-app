export type DataProviderMode = 'mock' | 'official';

/**
 * Single source of truth for BMU_DATA_PROVIDER.
 * Production must set BMU_DATA_PROVIDER=official. There is no silent mock fallback.
 * Development and test may use mock (including when the variable is unset).
 */
export function assertDataProviderPolicy(env: NodeJS.ProcessEnv = process.env): DataProviderMode {
  const nodeEnv = env.NODE_ENV;
  const provider = env.BMU_DATA_PROVIDER;
  if (nodeEnv === 'production') {
    if (provider !== 'official') {
      throw new Error(
        'Refusing to start: NODE_ENV=production requires BMU_DATA_PROVIDER=official. The mock provider must not be used in production.',
      );
    }
    return 'official';
  }
  if (provider === 'official') return 'official';
  if (provider == null || provider === '' || provider === 'mock') return 'mock';
  throw new Error(`Unknown BMU_DATA_PROVIDER "${provider}". Expected "mock" or "official".`);
}
