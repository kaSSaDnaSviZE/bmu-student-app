import { Module } from '@nestjs/common';
import { ObjectStorageProvider, createObjectStorage } from './object-storage';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      useFactory: (): ObjectStorageProvider => createObjectStorage(process.env),
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
