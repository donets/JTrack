import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { PresignedUpload, StorageProvider } from './storage-provider.interface'

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string

  constructor(configService: ConfigService) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR') ?? './uploads'
  }

  async getPresignedUpload(input: { fileName: string; mimeType: string }): Promise<PresignedUpload> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageKey = `${Date.now()}-${randomUUID()}-${safeFileName}`

    return {
      storageKey,
      uploadUrl: `/attachments/upload/${encodeURIComponent(storageKey)}`,
      headers: {
        'content-type': input.mimeType
      }
    }
  }

  async saveBase64(input: { storageKey: string; base64: string }) {
    const targetPath = join(this.uploadDir, input.storageKey)
    await mkdir(dirname(targetPath), { recursive: true })

    const buffer = Buffer.from(input.base64, 'base64')
    await writeFile(targetPath, buffer)

    return {
      url: this.getPublicUrl(input.storageKey),
      size: buffer.byteLength
    }
  }

  getPublicUrl(storageKey: string) {
    return `/uploads/${storageKey}`
  }
}
