import { Injectable, NotFoundException } from '@nestjs/common'
import {
  createTicketSchema,
  ticketStatusSchema,
  updateTicketSchema,
  type TicketStatus
} from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locationId: string, filters: { status?: string; assignedToUserId?: string }) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        locationId,
        deletedAt: null,
        status: filters.status as TicketStatus | undefined,
        assignedToUserId: filters.assignedToUserId
      },
      orderBy: { updatedAt: 'desc' }
    })

    return tickets.map((ticket: (typeof tickets)[number]) => this.serialize(ticket))
  }

  async getById(locationId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      include: {
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        paymentRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }

    return {
      ...this.serialize(ticket),
      comments: ticket.comments.map((comment: (typeof ticket.comments)[number]) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        deletedAt: comment.deletedAt?.toISOString() ?? null
      })),
      attachments: ticket.attachments.map((attachment: (typeof ticket.attachments)[number]) => ({
        ...attachment,
        createdAt: attachment.createdAt.toISOString(),
        updatedAt: attachment.updatedAt.toISOString(),
        deletedAt: attachment.deletedAt?.toISOString() ?? null
      })),
      paymentRecords: ticket.paymentRecords.map((payment: (typeof ticket.paymentRecords)[number]) => ({
        ...payment,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString()
      }))
    }
  }

  async create(locationId: string, createdByUserId: string, data: unknown) {
    const input = createTicketSchema.parse(data)

    const ticket = await this.prisma.ticket.create({
      data: {
        locationId,
        createdByUserId,
        assignedToUserId: input.assignedToUserId,
        title: input.title,
        description: input.description,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
        scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : null,
        priority: input.priority,
        totalAmountCents: input.totalAmountCents,
        currency: input.currency
      }
    })

    return this.serialize(ticket)
  }

  async update(locationId: string, ticketId: string, data: unknown) {
    const input = updateTicketSchema.parse(data)

    const ticket = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      data: {
        title: input.title,
        description: input.description,
        assignedToUserId: input.assignedToUserId,
        status: input.status,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : undefined,
        scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : undefined,
        priority: input.priority,
        totalAmountCents: input.totalAmountCents,
        currency: input.currency
      }
    })

    if (ticket.count === 0) {
      throw new NotFoundException('Ticket not found')
    }

    return this.getById(locationId, ticketId)
  }

  async transitionStatus(locationId: string, ticketId: string, status: string) {
    const nextStatus = ticketStatusSchema.parse(status)

    const updated = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      data: {
        status: nextStatus
      }
    })

    if (updated.count === 0) {
      throw new NotFoundException('Ticket not found')
    }

    return this.getById(locationId, ticketId)
  }

  async remove(locationId: string, ticketId: string) {
    const deleted = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    })

    if (deleted.count === 0) {
      throw new NotFoundException('Ticket not found')
    }

    return { ok: true }
  }

  private serialize(ticket: {
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
  }) {
    return {
      ...ticket,
      scheduledStartAt: ticket.scheduledStartAt?.toISOString() ?? null,
      scheduledEndAt: ticket.scheduledEndAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      deletedAt: ticket.deletedAt?.toISOString() ?? null
    }
  }
}
