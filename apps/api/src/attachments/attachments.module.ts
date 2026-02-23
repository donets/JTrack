import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AttachmentsController } from './attachments.controller'
import { AttachmentsService } from './attachments.service'
import {
  STORAGE_PROVIDER,
  type StorageProvider
} from './storage/storage-provider.interface'
import { LocalStorageProvider } from './storage/local-storage.provider'
import { S3StorageProvider } from './storage/s3-storage.provider'

@Module({
  controllers: [AttachmentsController],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
      useFactory: (
        configService: ConfigService,
        localStorageProvider: LocalStorageProvider,
        s3StorageProvider: S3StorageProvider
      ): StorageProvider => {
        const providerName = configService.get<string>('STORAGE_PROVIDER') ?? 'local'

        if (providerName === 's3') {
          return s3StorageProvider
        }

        return localStorageProvider
      }
    },
    AttachmentsService
  ],
  exports: [AttachmentsService]
})
export class AttachmentsModule {}
