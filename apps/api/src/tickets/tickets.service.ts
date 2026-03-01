import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common'
import {
  type CreateTicketInput,
  type RoleKey,
  type TicketListQuery,
  type TicketListResponse,
  type TicketStatus,
  type UpdateTicketInput,
  validateStatusTransition
} from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locationId: string, filters: TicketListQuery): Promise<TicketListResponse> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        locationId,
        deletedAt: null,
        status: filters.status as TicketStatus | undefined,
        assignedToUserId: filters.assignedToUserId
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: filters.offset,
      take: filters.limit + 1
    })

    const items = tickets
      .slice(0, filters.limit)
      .map((ticket: (typeof tickets)[number]) => this.serialize(ticket))
    const hasMore = tickets.length > filters.limit

    return {
      items,
      page: {
        limit: filters.limit,
        offset: filters.offset,
        nextOffset: hasMore ? filters.offset + items.length : null,
        hasMore
      }
    }
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
      comments: ticket.comments.map((comment: (typeof ticket.comments)[number]) => serializeDates(comment)),
      attachments: ticket.attachments.map((attachment: (typeof ticket.attachments)[number]) =>
        serializeDates(attachment)
      ),
      paymentRecords: ticket.paymentRecords.map((payment: (typeof ticket.paymentRecords)[number]) =>
        serializeDates(payment)
      )
    }
  }

  async create(locationId: string, createdByUserId: string, input: CreateTicketInput) {
    const ticket = await this.prisma.$transaction(async (tx) => {
      const nextTicketNumber = await this.getNextTicketNumber(locationId, tx)

      return tx.ticket.create({
        data: {
          locationId,
          ticketNumber: nextTicketNumber,
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
    })

    return this.serialize(ticket)
  }

  async update(locationId: string, ticketId: string, input: UpdateTicketInput) {
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

  async transitionStatus(
    locationId: string,
    role: RoleKey,
    ticketId: string,
    status: TicketStatus
  ) {
    const existing = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      select: { status: true }
    })

    if (!existing) {
      throw new NotFoundException('Ticket not found')
    }

    const validation = validateStatusTransition(existing.status, status, role)
    if (!validation.valid) {
      throw new UnprocessableEntityException(validation.reason ?? 'Invalid status transition')
    }

    const updated = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      data: {
        status
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
    ticketNumber: number
    createdByUserId: string
    assignedToUserId: string | null
    title: string
    description: string | null
    status: TicketStatus
    scheduledStartAt: Date | null
    scheduledEndAt: Date | null
    priority: string | null
    totalAmountCents: number | null
    currency: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }) {
    return serializeDates(ticket)
  }

  private async getNextTicketNumber(
    locationId: string,
    tx: Pick<PrismaService, 'ticket'>
  ): Promise<number> {
    const aggregate = await tx.ticket.aggregate({
      where: { locationId },
      _max: { ticketNumber: true }
    })

    return (aggregate._max.ticketNumber ?? 0) + 1
  }
}
