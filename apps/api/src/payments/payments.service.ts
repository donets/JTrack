import { Injectable, NotFoundException } from '@nestjs/common'
import type { CreatePaymentRecordInput, PaymentStatus } from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
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

    return payments.map((payment: (typeof payments)[number]) => serializeDates(payment))
  }

  async create(locationId: string, input: CreatePaymentRecordInput) {
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

    return serializeDates(payment)
  }

  async updateStatus(locationId: string, paymentId: string, status: PaymentStatus) {
    const payment = await this.prisma.paymentRecord.updateMany({
      where: {
        id: paymentId,
        locationId
      },
      data: {
        status
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

    return serializeDates(updated)
  }
}
