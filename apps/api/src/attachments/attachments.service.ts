import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type {
  CreateAttachmentMetadataInput,
  PresignInput,
  UploadInput
} from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
import { PrismaService } from '@/prisma/prisma.service'
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage-provider.interface'

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider
  ) {}

  async presign(input: PresignInput) {
    return this.storageProvider.getPresignedUpload(input)
  }

  async upload(storageKey: string, input: UploadInput) {
    return this.storageProvider.saveBase64({
      storageKey,
      base64: input.base64
    })
  }

  async createMetadata(
    locationId: string,
    uploadedByUserId: string,
    input: CreateAttachmentMetadataInput
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: input.ticketId,
        locationId,
        deletedAt: null
      },
      select: { id: true }
    })

    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }

    const attachment = await this.prisma.ticketAttachment.create({
      data: {
        locationId,
        ticketId: input.ticketId,
        uploadedByUserId,
        kind: input.kind,
        storageKey: input.storageKey,
        url: input.url,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width,
        height: input.height
      }
    })

    await this.prisma.ticketActivity.create({
      data: {
        ticketId: input.ticketId,
        locationId,
        userId: uploadedByUserId,
        type: 'attachment',
        metadata: {
          attachmentId: attachment.id,
          kind: attachment.kind,
          mimeType: attachment.mimeType,
          size: attachment.size
        }
      }
    })

    return serializeDates(attachment)
  }

  async list(locationId: string, ticketId: string) {
    const attachments = await this.prisma.ticketAttachment.findMany({
      where: {
        locationId,
        ticketId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return attachments.map((attachment: (typeof attachments)[number]) => serializeDates(attachment))
  }

  async remove(locationId: string, attachmentId: string) {
    const removed = await this.prisma.ticketAttachment.updateMany({
      where: {
        id: attachmentId,
        locationId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    })

    if (removed.count === 0) {
      throw new NotFoundException('Attachment not found')
    }

    return { ok: true }
  }
}
