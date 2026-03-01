import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import {
  type CreateTicketInput,
  type RoleKey,
  type TicketActivity,
  type TicketChecklistItem,
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

  async listActivity(locationId: string, ticketId: string): Promise<TicketActivity[]> {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      select: { id: true }
    })

    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }

    const activities = await this.prisma.ticketActivity.findMany({
      where: {
        locationId,
        ticketId
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    })

    return activities.map((activity) => this.serializeActivity(activity))
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
          checklist: input.checklist
            ? (input.checklist as unknown as Prisma.InputJsonValue)
            : undefined,
          scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
          scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : null,
          priority: input.priority,
          totalAmountCents: input.totalAmountCents,
          currency: input.currency
        }
      })
    })

    await this.createTicketActivity({
      ticketId: ticket.id,
      locationId,
      userId: createdByUserId,
      type: 'created',
      metadata: {
        status: ticket.status
      }
    })

    return this.serialize(ticket)
  }

  async update(
    locationId: string,
    updatedByUserId: string,
    ticketId: string,
    input: UpdateTicketInput
  ) {
    const existing = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        locationId,
        deletedAt: null
      },
      select: {
        id: true,
        status: true,
        assignedToUserId: true
      }
    })

    if (!existing) {
      throw new NotFoundException('Ticket not found')
    }

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
        checklist:
          input.checklist === undefined
            ? undefined
            : (input.checklist as unknown as Prisma.InputJsonValue),
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

    if (
      input.assignedToUserId !== undefined &&
      input.assignedToUserId !== existing.assignedToUserId
    ) {
      await this.createTicketActivity({
        ticketId,
        locationId,
        userId: updatedByUserId,
        type: 'assignment',
        metadata: {
          fromAssignedToUserId: existing.assignedToUserId ?? null,
          toAssignedToUserId: input.assignedToUserId ?? null
        }
      })
    }

    if (input.status && input.status !== existing.status) {
      await this.createTicketActivity({
        ticketId,
        locationId,
        userId: updatedByUserId,
        type: 'status_change',
        metadata: {
          from: existing.status,
          to: input.status
        }
      })
    }

    return this.getById(locationId, ticketId)
  }

  async transitionStatus(
    locationId: string,
    userId: string,
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

    if (existing.status !== status) {
      await this.createTicketActivity({
        ticketId,
        locationId,
        userId,
        type: 'status_change',
        metadata: {
          from: existing.status,
          to: status
        }
      })
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
    checklist: unknown
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
    const serialized = serializeDates(ticket)

    return {
      ...serialized,
      checklist: this.normalizeChecklist(ticket.checklist)
    }
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

  private serializeActivity(activity: {
    id: string
    ticketId: string
    locationId: string
    userId: string | null
    type: string
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): TicketActivity {
    const serialized = serializeDates(activity)

    return {
      ...serialized,
      type: activity.type as TicketActivity['type'],
      metadata:
        activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata)
          ? (activity.metadata as TicketActivity['metadata'])
          : {}
    }
  }

  private async createTicketActivity(input: {
    ticketId: string
    locationId: string
    userId: string | null
    type: TicketActivity['type']
    metadata: TicketActivity['metadata']
  }) {
    await this.prisma.ticketActivity.create({
      data: {
        ticketId: input.ticketId,
        locationId: input.locationId,
        userId: input.userId,
        type: input.type,
        metadata: input.metadata as Prisma.InputJsonValue
      }
    })
  }

  private normalizeChecklist(raw: unknown): TicketChecklistItem[] {
    if (!Array.isArray(raw)) {
      return []
    }

    const normalized: TicketChecklistItem[] = []
    for (const item of raw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue
      }

      const record = item as Record<string, unknown>
      if (
        typeof record.id === 'string' &&
        typeof record.label === 'string' &&
        typeof record.checked === 'boolean'
      ) {
        normalized.push({
          id: record.id,
          label: record.label,
          checked: record.checked
        })
      }
    }

    return normalized
  }
}
