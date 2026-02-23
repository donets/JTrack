import { Injectable } from '@nestjs/common'
import type { PresignedUpload, StorageProvider } from './storage-provider.interface'

@Injectable()
export class S3StorageProvider implements StorageProvider {
  async getPresignedUpload(_: { fileName: string; mimeType: string }): Promise<PresignedUpload> {
    throw new Error('S3StorageProvider is not configured in this environment')
  }

  async saveBase64(_: { storageKey: string; base64: string }): Promise<{ url: string; size: number }> {
    throw new Error('S3StorageProvider is not configured in this environment')
  }

  getPublicUrl(storageKey: string): string {
    return storageKey
  }
}
