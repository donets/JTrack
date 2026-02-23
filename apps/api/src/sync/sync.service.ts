import { ForbiddenException, Injectable } from '@nestjs/common'
import { type Prisma } from '@prisma/client'
import {
  syncPullRequestSchema,
  syncPushRequestSchema,
  type SyncChanges,
  type SyncPullResponse,
  type SyncPushResponse,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type PaymentRecord
} from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pull(rawBody: unknown, activeLocationId: string): Promise<SyncPullResponse> {
    const body = syncPullRequestSchema.parse(rawBody)

    if (body.locationId !== activeLocationId) {
      throw new ForbiddenException('Body locationId must match x-location-id')
    }

    const lastPulledAt = body.lastPulledAt ?? 0
    const since = new Date(lastPulledAt)

    const [tickets, ticketComments, ticketAttachments, paymentRecords] = await Promise.all([
      this.prisma.ticket.findMany({
        where: {
          locationId: body.locationId,
          OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
        },
        orderBy: { updatedAt: 'asc' }
      }),
      this.prisma.ticketComment.findMany({
        where: {
          locationId: body.locationId,
          OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
        },
        orderBy: { updatedAt: 'asc' }
      }),
      this.prisma.ticketAttachment.findMany({
        where: {
          locationId: body.locationId,
          OR: [{ updatedAt: { gt: since } }, { deletedAt: { gt: since } }]
        },
        orderBy: { updatedAt: 'asc' }
      }),
      this.prisma.paymentRecord.findMany({
        where: {
          locationId: body.locationId,
          updatedAt: { gt: since }
        },
        orderBy: { updatedAt: 'asc' }
      })
    ])

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

    return {
      changes,
      timestamp: Date.now()
    }
  }

  async push(rawBody: unknown, activeLocationId: string): Promise<SyncPushResponse> {
    const body = syncPushRequestSchema.parse(rawBody)

    if (body.locationId !== activeLocationId) {
      throw new ForbiddenException('Body locationId must match x-location-id')
    }

    const lastPulledAt = new Date(body.lastPulledAt ?? 0)
    const now = new Date()

    await this.prisma.$transaction(async (tx) => {
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
    for (const record of [...changes.tickets.created, ...changes.tickets.updated]) {
      const existing = await tx.ticket.findUnique({ where: { id: record.id } })

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

    for (const deletedId of changes.tickets.deleted) {
      const existing = await tx.ticket.findUnique({ where: { id: deletedId } })

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
    for (const record of [...changes.ticketComments.created, ...changes.ticketComments.updated]) {
      const existing = await tx.ticketComment.findUnique({ where: { id: record.id } })

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

    for (const deletedId of changes.ticketComments.deleted) {
      const existing = await tx.ticketComment.findUnique({ where: { id: deletedId } })

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
    for (const record of [...changes.ticketAttachments.created, ...changes.ticketAttachments.updated]) {
      const existing = await tx.ticketAttachment.findUnique({ where: { id: record.id } })

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

    for (const deletedId of changes.ticketAttachments.deleted) {
      const existing = await tx.ticketAttachment.findUnique({ where: { id: deletedId } })

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
    for (const record of [...changes.paymentRecords.created, ...changes.paymentRecords.updated]) {
      const existing = await tx.paymentRecord.findUnique({ where: { id: record.id } })

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
    return {
      id: ticket.id,
      locationId: ticket.locationId,
      createdByUserId: ticket.createdByUserId,
      assignedToUserId: ticket.assignedToUserId,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as Ticket['status'],
      scheduledStartAt: ticket.scheduledStartAt?.toISOString() ?? null,
      scheduledEndAt: ticket.scheduledEndAt?.toISOString() ?? null,
      priority: ticket.priority,
      totalAmountCents: ticket.totalAmountCents,
      currency: ticket.currency,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      deletedAt: ticket.deletedAt?.toISOString() ?? null
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
    return {
      id: comment.id,
      ticketId: comment.ticketId,
      locationId: comment.locationId,
      authorUserId: comment.authorUserId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      deletedAt: comment.deletedAt?.toISOString() ?? null
    }
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
    return {
      id: attachment.id,
      ticketId: attachment.ticketId,
      locationId: attachment.locationId,
      uploadedByUserId: attachment.uploadedByUserId,
      kind: attachment.kind as TicketAttachment['kind'],
      storageKey: attachment.storageKey,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
      width: attachment.width,
      height: attachment.height,
      createdAt: attachment.createdAt.toISOString(),
      updatedAt: attachment.updatedAt.toISOString(),
      deletedAt: attachment.deletedAt?.toISOString() ?? null
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
    return {
      id: payment.id,
      ticketId: payment.ticketId,
      locationId: payment.locationId,
      provider: payment.provider as PaymentRecord['provider'],
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status as PaymentRecord['status'],
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }
  }
}
