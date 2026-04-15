import { Module } from '@nestjs/common';
import { minioProviders } from './storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [...minioProviders, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
