import { ForbiddenException, Injectable } from '@nestjs/common'
import { type Prisma } from '@prisma/client'
import {
  type SyncChanges,
  type SyncPullRequest,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type PaymentRecord
} from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pull(body: SyncPullRequest, activeLocationId: string): Promise<SyncPullResponse> {
    if (body.locationId !== activeLocationId) {
      throw new ForbiddenException('Body locationId must match x-location-id')
    }

    const lastPulledAt = body.lastPulledAt ?? 0
    const since = new Date(lastPulledAt)
    const limit = body.limit
    const snapshotAt = body.cursor?.snapshotAt ?? Date.now()
    const snapshotDate = new Date(snapshotAt)
    const offsets = {
      tickets: body.cursor?.ticketsOffset ?? 0,
      ticketComments: body.cursor?.ticketCommentsOffset ?? 0,
      ticketAttachments: body.cursor?.ticketAttachmentsOffset ?? 0,
      paymentRecords: body.cursor?.paymentRecordsOffset ?? 0
    }

    const [ticketRows, ticketCommentRows, ticketAttachmentRows, paymentRecordRows] =
      await Promise.all([
        this.prisma.ticket.findMany({
          where: {
            locationId: body.locationId,
            OR: [
              { updatedAt: { gt: since, lte: snapshotDate } },
              { deletedAt: { gt: since, lte: snapshotDate } }
            ]
          },
          orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
          skip: offsets.tickets,
          take: limit + 1
        }),
        this.prisma.ticketComment.findMany({
          where: {
            locationId: body.locationId,
            OR: [
              { updatedAt: { gt: since, lte: snapshotDate } },
              { deletedAt: { gt: since, lte: snapshotDate } }
            ]
          },
          orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
          skip: offsets.ticketComments,
          take: limit + 1
        }),
        this.prisma.ticketAttachment.findMany({
          where: {
            locationId: body.locationId,
            OR: [
              { updatedAt: { gt: since, lte: snapshotDate } },
              { deletedAt: { gt: since, lte: snapshotDate } }
            ]
          },
          orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
          skip: offsets.ticketAttachments,
          take: limit + 1
        }),
        this.prisma.paymentRecord.findMany({
          where: {
            locationId: body.locationId,
            updatedAt: { gt: since, lte: snapshotDate }
          },
          orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
          skip: offsets.paymentRecords,
          take: limit + 1
        })
      ])

    const tickets = ticketRows.slice(0, limit)
    const ticketComments = ticketCommentRows.slice(0, limit)
    const ticketAttachments = ticketAttachmentRows.slice(0, limit)
    const paymentRecords = paymentRecordRows.slice(0, limit)
    const ticketsHasMore = ticketRows.length > limit
    const ticketCommentsHasMore = ticketCommentRows.length > limit
    const ticketAttachmentsHasMore = ticketAttachmentRows.length > limit
    const paymentRecordsHasMore = paymentRecordRows.length > limit

    const changes: SyncChanges = {
      tickets: { created: [], updated: [], deleted: [] },
      ticketComments: { created: [], updated: [], deleted: [] },
      ticketAttachments: { created: [], updated: [], deleted: [] },
      paymentRecords: { created: [], updated: [], deleted: [] }
    }

    for (const ticket of tickets) {
      if (ticket.deletedAt && ticket.deletedAt.getTime() > lastPulledAt) {
        changes.tickets.deleted.push(ticket.id)
      } else if (ticket.createdAt.getTime() > lastPulledAt) {
        changes.tickets.created.push(this.serializeTicket(ticket))
      } else {
        changes.tickets.updated.push(this.serializeTicket(ticket))
      }
    }

    for (const comment of ticketComments) {
      if (comment.deletedAt && comment.deletedAt.getTime() > lastPulledAt) {
        changes.ticketComments.deleted.push(comment.id)
      } else if (comment.createdAt.getTime() > lastPulledAt) {
        changes.ticketComments.created.push(this.serializeComment(comment))
      } else {
        changes.ticketComments.updated.push(this.serializeComment(comment))
      }
    }

    for (const attachment of ticketAttachments) {
      if (attachment.deletedAt && attachment.deletedAt.getTime() > lastPulledAt) {
        changes.ticketAttachments.deleted.push(attachment.id)
      } else if (attachment.createdAt.getTime() > lastPulledAt) {
        changes.ticketAttachments.created.push(this.serializeAttachment(attachment))
      } else {
        changes.ticketAttachments.updated.push(this.serializeAttachment(attachment))
      }
    }

    for (const payment of paymentRecords) {
      if (payment.createdAt.getTime() > lastPulledAt) {
        changes.paymentRecords.created.push(this.serializePayment(payment))
      } else {
        changes.paymentRecords.updated.push(this.serializePayment(payment))
      }
    }

    const hasMore =
      ticketsHasMore || ticketCommentsHasMore || ticketAttachmentsHasMore || paymentRecordsHasMore

    return {
      changes,
      timestamp: snapshotAt,
      hasMore,
      nextCursor: hasMore
        ? {
            snapshotAt,
            ticketsOffset: offsets.tickets + tickets.length,
            ticketCommentsOffset: offsets.ticketComments + ticketComments.length,
            ticketAttachmentsOffset: offsets.ticketAttachments + ticketAttachments.length,
            paymentRecordsOffset: offsets.paymentRecords + paymentRecords.length
          }
        : null
    }
  }

  async push(body: SyncPushRequest, activeLocationId: string): Promise<SyncPushResponse> {
    if (body.locationId !== activeLocationId) {
      throw new ForbiddenException('Body locationId must match x-location-id')
    }

    const lastPulledAt = new Date(body.lastPulledAt ?? 0)
    const now = new Date()

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.applyTicketChanges(tx, body.locationId, body.changes, lastPulledAt, now)
      await this.applyCommentChanges(tx, body.locationId, body.changes, lastPulledAt, now)
      await this.applyAttachmentChanges(tx, body.locationId, body.changes, lastPulledAt, now)
      await this.applyPaymentChanges(tx, body.locationId, body.changes, lastPulledAt, now)
    })

    return {
      ok: true,
      newTimestamp: now.getTime()
    }
  }

  private async applyTicketChanges(
    tx: Prisma.TransactionClient,
    locationId: string,
    changes: SyncChanges,
    lastPulledAt: Date,
    now: Date
  ) {
    const upsertRecords = [...changes.tickets.created, ...changes.tickets.updated]
    const existingUpsertById = await this.loadExistingById(
      upsertRecords.map((record) => record.id),
      (ids: string[]) =>
        tx.ticket.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const record of upsertRecords) {
      const existing = existingUpsertById.get(record.id)
      if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
        continue
      }

      if (existing) {
        await tx.ticket.update({
          where: { id: record.id },
          data: {
            title: record.title,
            description: record.description,
            status: record.status,
            assignedToUserId: record.assignedToUserId,
            scheduledStartAt: record.scheduledStartAt ? new Date(record.scheduledStartAt) : null,
            scheduledEndAt: record.scheduledEndAt ? new Date(record.scheduledEndAt) : null,
            priority: record.priority,
            totalAmountCents: record.totalAmountCents,
            currency: record.currency,
            updatedAt: now,
            deletedAt: null
          }
        })
      } else {
        await tx.ticket.create({
          data: {
            id: record.id,
            locationId,
            createdByUserId: record.createdByUserId,
            assignedToUserId: record.assignedToUserId,
            title: record.title,
            description: record.description,
            status: record.status,
            scheduledStartAt: record.scheduledStartAt ? new Date(record.scheduledStartAt) : null,
            scheduledEndAt: record.scheduledEndAt ? new Date(record.scheduledEndAt) : null,
            priority: record.priority,
            totalAmountCents: record.totalAmountCents,
            currency: record.currency,
            createdAt: new Date(record.createdAt),
            updatedAt: now
          }
        })
      }
    }

    const existingDeletedById = await this.loadExistingById(changes.tickets.deleted, (ids: string[]) =>
      tx.ticket.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          locationId: true,
          updatedAt: true
        }
      })
    )

    for (const deletedId of changes.tickets.deleted) {
      const existing = existingDeletedById.get(deletedId)

      if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
        continue
      }

      await tx.ticket.update({
        where: { id: deletedId },
        data: {
          deletedAt: now,
          updatedAt: now
        }
      })
    }
  }

  private async applyCommentChanges(
    tx: Prisma.TransactionClient,
    locationId: string,
    changes: SyncChanges,
    lastPulledAt: Date,
    now: Date
  ) {
    const upsertRecords = [...changes.ticketComments.created, ...changes.ticketComments.updated]
    const existingUpsertById = await this.loadExistingById(
      upsertRecords.map((record) => record.id),
      (ids: string[]) =>
        tx.ticketComment.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const record of upsertRecords) {
      const existing = existingUpsertById.get(record.id)
      if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
        continue
      }

      if (existing) {
        await tx.ticketComment.update({
          where: { id: record.id },
          data: {
            body: record.body,
            updatedAt: now,
            deletedAt: null
          }
        })
      } else {
        await tx.ticketComment.create({
          data: {
            id: record.id,
            ticketId: record.ticketId,
            locationId,
            authorUserId: record.authorUserId,
            body: record.body,
            createdAt: new Date(record.createdAt),
            updatedAt: now
          }
        })
      }
    }

    const existingDeletedById = await this.loadExistingById(
      changes.ticketComments.deleted,
      (ids: string[]) =>
        tx.ticketComment.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const deletedId of changes.ticketComments.deleted) {
      const existing = existingDeletedById.get(deletedId)

      if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
        continue
      }

      await tx.ticketComment.update({
        where: { id: deletedId },
        data: {
          deletedAt: now,
          updatedAt: now
        }
      })
    }
  }

  private async applyAttachmentChanges(
    tx: Prisma.TransactionClient,
    locationId: string,
    changes: SyncChanges,
    lastPulledAt: Date,
    now: Date
  ) {
    const upsertRecords = [...changes.ticketAttachments.created, ...changes.ticketAttachments.updated]
    const existingUpsertById = await this.loadExistingById(
      upsertRecords.map((record) => record.id),
      (ids: string[]) =>
        tx.ticketAttachment.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const record of upsertRecords) {
      const existing = existingUpsertById.get(record.id)
      if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
        continue
      }

      if (existing) {
        await tx.ticketAttachment.update({
          where: { id: record.id },
          data: {
            kind: record.kind,
            storageKey: record.storageKey,
            url: record.url,
            mimeType: record.mimeType,
            size: record.size,
            width: record.width,
            height: record.height,
            updatedAt: now,
            deletedAt: null
          }
        })
      } else {
        await tx.ticketAttachment.create({
          data: {
            id: record.id,
            ticketId: record.ticketId,
            locationId,
            uploadedByUserId: record.uploadedByUserId,
            kind: record.kind,
            storageKey: record.storageKey,
            url: record.url,
            mimeType: record.mimeType,
            size: record.size,
            width: record.width,
            height: record.height,
            createdAt: new Date(record.createdAt),
            updatedAt: now
          }
        })
      }
    }

    const existingDeletedById = await this.loadExistingById(
      changes.ticketAttachments.deleted,
      (ids: string[]) =>
        tx.ticketAttachment.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const deletedId of changes.ticketAttachments.deleted) {
      const existing = existingDeletedById.get(deletedId)

      if (!existing || existing.locationId !== locationId || existing.updatedAt > lastPulledAt) {
        continue
      }

      await tx.ticketAttachment.update({
        where: { id: deletedId },
        data: {
          deletedAt: now,
          updatedAt: now
        }
      })
    }
  }

  private async applyPaymentChanges(
    tx: Prisma.TransactionClient,
    locationId: string,
    changes: SyncChanges,
    lastPulledAt: Date,
    now: Date
  ) {
    const upsertRecords = [...changes.paymentRecords.created, ...changes.paymentRecords.updated]
    const existingUpsertById = await this.loadExistingById(
      upsertRecords.map((record) => record.id),
      (ids: string[]) =>
        tx.paymentRecord.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            locationId: true,
            updatedAt: true
          }
        })
    )

    for (const record of upsertRecords) {
      const existing = existingUpsertById.get(record.id)
      if (existing && (existing.locationId !== locationId || existing.updatedAt > lastPulledAt)) {
        continue
      }

      if (existing) {
        await tx.paymentRecord.update({
          where: { id: record.id },
          data: {
            provider: record.provider,
            amountCents: record.amountCents,
            currency: record.currency,
            status: record.status,
            updatedAt: now
          }
        })
      } else {
        await tx.paymentRecord.create({
          data: {
            id: record.id,
            locationId,
            ticketId: record.ticketId,
            provider: record.provider,
            amountCents: record.amountCents,
            currency: record.currency,
            status: record.status,
            createdAt: new Date(record.createdAt),
            updatedAt: now
          }
        })
      }
    }
  }

  private async loadExistingById<T extends { id: string; locationId: string; updatedAt: Date }>(
    ids: string[],
    loader: (ids: string[]) => Promise<T[]>
  ): Promise<Map<string, T>> {
    const uniqueIds = this.uniqueIds(ids)

    if (uniqueIds.length === 0) {
      return new Map()
    }

    const records = await loader(uniqueIds)
    return new Map(records.map((record) => [record.id, record]))
  }

  private uniqueIds(ids: string[]) {
    return Array.from(new Set(ids))
  }

  private serializeTicket(ticket: {
    id: string
    locationId: string
    createdByUserId: string
    assignedToUserId: string | null
    title: string
    description: string | null
    status: string
    scheduledStartAt: Date | null
    scheduledEndAt: Date | null
    priority: string | null
    totalAmountCents: number | null
    currency: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): Ticket {
    const serialized = serializeDates(ticket)

    return {
      ...serialized,
      status: ticket.status as Ticket['status']
    }
  }

  private serializeComment(comment: {
    id: string
    ticketId: string
    locationId: string
    authorUserId: string
    body: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): TicketComment {
    return serializeDates(comment) as TicketComment
  }

  private serializeAttachment(attachment: {
    id: string
    ticketId: string
    locationId: string
    uploadedByUserId: string
    kind: string
    storageKey: string
    url: string
    mimeType: string
    size: number
    width: number | null
    height: number | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): TicketAttachment {
    const serialized = serializeDates(attachment)

    return {
      ...serialized,
      kind: attachment.kind as TicketAttachment['kind']
    }
  }

  private serializePayment(payment: {
    id: string
    ticketId: string
    locationId: string
    provider: string
    amountCents: number
    currency: string
    status: string
    createdAt: Date
    updatedAt: Date
  }): PaymentRecord {
    const serialized = serializeDates(payment)

    return {
      ...serialized,
      provider: payment.provider as PaymentRecord['provider'],
      status: payment.status as PaymentRecord['status']
    }
  }
}
