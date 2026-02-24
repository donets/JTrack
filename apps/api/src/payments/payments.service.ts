import { Injectable, NotFoundException } from '@nestjs/common'
import { createPaymentRecordSchema, paymentStatusSchema } from '@jtrack/shared'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locationId: string, ticketId?: string) {
    const payments = await this.prisma.paymentRecord.findMany({
      where: {
        locationId,
        ticketId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return payments.map((payment: (typeof payments)[number]) => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }))
  }

  async create(locationId: string, data: unknown) {
    const input = createPaymentRecordSchema.parse(data)

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

    const payment = await this.prisma.paymentRecord.create({
      data: {
        locationId,
        ticketId: input.ticketId,
        provider: input.provider,
        amountCents: input.amountCents,
        currency: input.currency,
        status: input.status
      }
    })

    return {
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }
  }

  async updateStatus(locationId: string, paymentId: string, status: string) {
    const nextStatus = paymentStatusSchema.parse(status)

    const payment = await this.prisma.paymentRecord.updateMany({
      where: {
        id: paymentId,
        locationId
      },
      data: {
        status: nextStatus
      }
    })

    if (payment.count === 0) {
      throw new NotFoundException('Payment record not found')
    }

    const updated = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId }
    })

    if (!updated) {
      throw new NotFoundException('Payment record not found')
    }

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  }
}
