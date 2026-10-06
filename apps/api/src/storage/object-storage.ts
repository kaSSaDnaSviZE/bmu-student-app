import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';

export const MAX_OBJECT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);

export interface StoredObjectRef {
  bucket: string;
  objectKey: string;
  mime: string;
  size: number;
  checksum: string;
}

export interface PutObjectInput {
  purpose: string;
  filename: string;
  mime: string;
  bytes: Buffer;
}

export interface ObjectStorageProvider {
  put(input: PutObjectInput): Promise<StoredObjectRef>;
  get(objectKey: string): Promise<{ bytes: Buffer; mime: string } | null>;
  delete(objectKey: string): Promise<void>;
}

export interface S3StorageConfig {
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

export class ObjectStorageNotConfiguredError extends Error {
  constructor() {
    super(
      'S3-compatible object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
    );
    this.name = 'ObjectStorageNotConfiguredError';
  }
}

export class ObjectStorageClientUnavailableError extends Error {
  constructor() {
    super('S3-compatible storage is configured, but no upload client is bundled in this build. Bytes are not stored.');
    this.name = 'ObjectStorageClientUnavailableError';
  }
}

export function assertSafeObjectKey(objectKey: string) {
  if (!objectKey || objectKey.includes('..') || objectKey.includes('\\') || objectKey.startsWith('/') || objectKey.includes('\0')) {
    throw new Error('Invalid object key: path traversal rejected');
  }
}

export function validateUpload(mime: string, size: number) {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`MIME type not allowed: ${mime}`);
  }
  if (!Number.isFinite(size) || size < 0) {
    throw new Error('Invalid file size');
  }
  if (size > MAX_OBJECT_BYTES) {
    throw new Error('File exceeds 10MB limit');
  }
}

function safePurpose(purpose: string) {
  const cleaned = purpose.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) throw new Error('Invalid storage purpose');
  return cleaned;
}

function safeFilename(filename: string) {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!base || base === '.' || base === '..' || base.includes('..')) {
    throw new Error('Invalid filename');
  }
  return base;
}

export class LocalStorageProvider implements ObjectStorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly bucket = 'local',
  ) {}

  async put(input: PutObjectInput): Promise<StoredObjectRef> {
    validateUpload(input.mime, input.bytes.length);
    const objectKey = `${safePurpose(input.purpose)}/${randomUUID()}-${safeFilename(input.filename)}`;
    assertSafeObjectKey(objectKey);
    const full = this.resolve(objectKey);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, input.bytes);
    return {
      bucket: this.bucket,
      objectKey,
      mime: input.mime,
      size: input.bytes.length,
      checksum: createHash('sha256').update(input.bytes).digest('hex'),
    };
  }

  async get(objectKey: string): Promise<{ bytes: Buffer; mime: string } | null> {
    assertSafeObjectKey(objectKey);
    try {
      const bytes = await readFile(this.resolve(objectKey));
      return { bytes, mime: 'application/octet-stream' };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async delete(objectKey: string): Promise<void> {
    assertSafeObjectKey(objectKey);
    await rm(this.resolve(objectKey), { force: true });
  }

  private resolve(objectKey: string) {
    const root = path.resolve(this.rootDir);
    const full = path.resolve(root, objectKey);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error('Invalid object key: path traversal rejected');
    }
    return full;
  }
}

export class S3CompatibleStorageProvider implements ObjectStorageProvider {
  constructor(private readonly config: S3StorageConfig) {}

  private assertConfigured() {
    const { endpoint, bucket, accessKeyId, secretAccessKey } = this.config;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ObjectStorageNotConfiguredError();
    }
  }

  async put(input: PutObjectInput): Promise<StoredObjectRef> {
    this.assertConfigured();
    validateUpload(input.mime, input.bytes.length);
    assertSafeObjectKey(`${safePurpose(input.purpose)}/${safeFilename(input.filename)}`);
    throw new ObjectStorageClientUnavailableError();
  }

  async get(objectKey: string): Promise<{ bytes: Buffer; mime: string } | null> {
    this.assertConfigured();
    assertSafeObjectKey(objectKey);
    throw new ObjectStorageClientUnavailableError();
  }

  async delete(objectKey: string): Promise<void> {
    this.assertConfigured();
    assertSafeObjectKey(objectKey);
    throw new ObjectStorageClientUnavailableError();
  }
}

export function createObjectStorage(env: NodeJS.ProcessEnv = process.env): ObjectStorageProvider {
  if (env.OBJECT_STORAGE_PROVIDER === 's3') {
    return new S3CompatibleStorageProvider({
      endpoint: env.S3_ENDPOINT,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      region: env.S3_REGION,
    });
  }
  const root = env.OBJECT_STORAGE_LOCAL_DIR || path.join(process.cwd(), '.data', 'objects');
  return new LocalStorageProvider(root);
}
