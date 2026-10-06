import { mkdtemp, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
  LocalStorageProvider,
  MAX_OBJECT_BYTES,
  ObjectStorageClientUnavailableError,
  ObjectStorageNotConfiguredError,
  S3CompatibleStorageProvider,
  assertSafeObjectKey,
} from './object-storage';

describe('object storage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'bmu-objects-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('stores bytes on the local filesystem and rejects unsafe names, mime, and size', async () => {
    const provider = new LocalStorageProvider(dir);
    const stored = await provider.put({
      purpose: 'submission',
      filename: 'notes.pdf',
      mime: 'application/pdf',
      bytes: Buffer.from('%PDF-demo'),
    });
    expect(stored.objectKey.startsWith('submission/')).toBe(true);
    expect(stored.objectKey.includes('..')).toBe(false);
    expect(stored.checksum).toHaveLength(64);
    expect(stored.size).toBe(9);
    const file = await stat(path.join(dir, stored.objectKey));
    expect(file.isFile()).toBe(true);
    const loaded = await provider.get(stored.objectKey);
    expect(loaded?.bytes.toString()).toBe('%PDF-demo');
    await provider.delete(stored.objectKey);
    expect(await provider.get(stored.objectKey)).toBeNull();

    const nested = await provider.put({
      purpose: '../etc',
      filename: '../../passwd',
      mime: 'text/plain',
      bytes: Buffer.from('nope'),
    });
    expect(nested.objectKey.includes('..')).toBe(false);
    expect(path.resolve(dir, nested.objectKey).startsWith(path.resolve(dir))).toBe(true);

    await expect(
      provider.put({ purpose: '..', filename: 'a.txt', mime: 'text/plain', bytes: Buffer.from('a') }),
    ).rejects.toThrow(/purpose/);
    await expect(
      provider.put({ purpose: 'submission', filename: 'evil.exe', mime: 'application/x-msdownload', bytes: Buffer.from('x') }),
    ).rejects.toThrow(/MIME/);
    await expect(
      provider.put({
        purpose: 'submission',
        filename: 'big.pdf',
        mime: 'application/pdf',
        bytes: Buffer.alloc(MAX_OBJECT_BYTES + 1),
      }),
    ).rejects.toThrow(/10MB/);
    expect(() => assertSafeObjectKey('../secrets')).toThrow(/traversal/);
    await expect(provider.get('../secrets')).rejects.toThrow(/traversal/);
  });

  it('does not call S3 unless endpoint, bucket, and keys exist', async () => {
    const missing = new S3CompatibleStorageProvider({});
    await expect(
      missing.put({ purpose: 'submission', filename: 'a.pdf', mime: 'application/pdf', bytes: Buffer.from('%PDF') }),
    ).rejects.toBeInstanceOf(ObjectStorageNotConfiguredError);

    const configured = new S3CompatibleStorageProvider({
      endpoint: 'http://127.0.0.1:9000',
      bucket: 'bmu-demo',
      accessKeyId: 'local-key',
      secretAccessKey: 'local-secret',
    });
    await expect(
      configured.put({ purpose: 'submission', filename: 'a.pdf', mime: 'application/pdf', bytes: Buffer.from('%PDF') }),
    ).rejects.toBeInstanceOf(ObjectStorageClientUnavailableError);
  });
});
