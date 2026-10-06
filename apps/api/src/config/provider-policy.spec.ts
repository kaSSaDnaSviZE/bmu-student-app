import { assertDataProviderPolicy } from './provider-policy';

describe('assertDataProviderPolicy', () => {
  it('rejects mock and missing providers in production', () => {
    expect(() => assertDataProviderPolicy({ NODE_ENV: 'production', BMU_DATA_PROVIDER: 'mock' })).toThrow(
      /BMU_DATA_PROVIDER=official/,
    );
    expect(() => assertDataProviderPolicy({ NODE_ENV: 'production' })).toThrow(/official/);
    expect(() => assertDataProviderPolicy({ NODE_ENV: 'production', BMU_DATA_PROVIDER: 'Official' })).toThrow(
      /official/,
    );
  });

  it('accepts the official provider in production', () => {
    expect(assertDataProviderPolicy({ NODE_ENV: 'production', BMU_DATA_PROVIDER: 'official' })).toBe('official');
  });

  it('allows mock in development and test, including when unset', () => {
    expect(assertDataProviderPolicy({ NODE_ENV: 'development', BMU_DATA_PROVIDER: 'mock' })).toBe('mock');
    expect(assertDataProviderPolicy({ NODE_ENV: 'test' })).toBe('mock');
    expect(assertDataProviderPolicy({})).toBe('mock');
    expect(assertDataProviderPolicy({ BMU_DATA_PROVIDER: 'official' })).toBe('official');
  });

  it('rejects unknown provider names outside production', () => {
    expect(() => assertDataProviderPolicy({ NODE_ENV: 'development', BMU_DATA_PROVIDER: 'staging' })).toThrow(
      /Unknown BMU_DATA_PROVIDER/,
    );
  });
});
